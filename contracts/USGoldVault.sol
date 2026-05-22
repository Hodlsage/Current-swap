// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/* ============================================================================
 * FILE: contracts/USGoldVault.sol
 * CONTRACT: USGoldVault
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.1.0  2026-05-22  Initial atomic redemption-vault implementation.
 *     - Replaces the old usgv2.sol mint-on-demand + bonding-curve + reflection
 *       model entirely. See docs/USGOLD_VAULT_SPEC.md.
 * ----------------------------------------------------------------------------
 * OVERVIEW
 *   A two-way redemption vault between:
 *     - Current (CRNT): an ERC-20 dollar instrument. ATOMIC: decimals = 0.
 *       1 CRNT = 1 indivisible whole unit. All pricing here is whole-number.
 *     - USGold: an ERC-721 certificate, each representing 1 oz American Gold
 *       Eagle in custody. Certificates are PRE-MINTED into this vault.
 *
 *   PRICE: a single updatable oracle value `eaglePriceCRNT` = the US Mint
 *   American Gold Eagle 1 oz price, expressed in whole CRNT. Updated (e.g.
 *   weekly) by an authorized PRICE_FEEDER. A max-change guard prevents a single
 *   bad update from draining the reserve.
 *
 *   SWAP IN  (CRNT -> USGold): user pays `eaglePriceCRNT` CRNT, receives 1
 *            certificate from inventory.
 *   SWAP OUT (USGold -> CRNT): user returns 1 certificate, receives the CURRENT
 *            `eaglePriceCRNT` CRNT from the reserve.
 *
 *   SOLVENCY: a single reserve pool inside the vault holds both the CRNT
 *   liquidity and the USGold inventory. Swap-out pays from the CRNT reserve and
 *   reverts if the reserve cannot cover the payout. The owner funds/withdraws
 *   reserve liquidity explicitly. The vault never promises a payout it cannot
 *   make in the same transaction.
 * ----------------------------------------------------------------------------
 * AUDIT NOTES (intentional design choices)
 *   - CEI (checks-effects-interactions) ordering + ReentrancyGuard on swaps.
 *   - Atomic math only: no 1e18 scaling anywhere. CRNT amounts are whole units.
 *   - Pausable circuit breaker.
 *   - Price updates bounded by maxPriceChangeBps to limit oracle/key risk.
 *   - Role separation: owner (admin) vs priceFeeder (price only).
 *   - Uses OpenZeppelin if available; minimal local interfaces declared so this
 *     file is self-contained for review. Swap to OZ imports before audit.
 * ==========================================================================*/

/* --------------------------------------------------------------------------
 * Minimal interfaces (self-contained for review). For production, replace with
 * "@openzeppelin/contracts" IERC20 / IERC721 / IERC721Receiver imports.
 * ------------------------------------------------------------------------*/
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external returns (bytes4);
}

/* --------------------------------------------------------------------------
 * USGoldVault
 * ------------------------------------------------------------------------*/
contract USGoldVault is IERC721Receiver {
    /* ------------------------------------------------------------ roles */

    /// @notice Admin: funds reserve, manages inventory, sets feeder, pauses.
    address public owner;

    /// @notice The only address allowed to update the Eagle price.
    address public priceFeeder;

    /* --------------------------------------------------------- tokens */

    /// @notice Current (CRNT) — the atomic (0-decimal) dollar instrument.
    IERC20 public immutable current;

    /// @notice USGold certificate collection (ERC-721).
    IERC721 public immutable usgold;

    /* ---------------------------------------------------------- pricing */

    /// @notice American Gold Eagle 1 oz price in WHOLE CRNT (atomic). e.g. 4750.
    uint256 public eaglePriceCRNT;

    /// @notice Max allowed change per price update, in basis points (1% = 100).
    ///         Guards against fat-finger / compromised-feeder draining the pool.
    uint256 public maxPriceChangeBps = 2000; // 20% default; owner-tunable.

    /// @notice Timestamp of the last price update (for off-chain monitoring).
    uint256 public lastPriceUpdate;

    /* ------------------------------------------------------ inventory */

    /// @notice Ordered list of certificate tokenIds currently held by the vault
    ///         and available to swap out to users (FIFO inventory).
    uint256[] private _inventory;

    /// @notice tokenId => index+1 in _inventory (0 means "not in inventory").
    mapping(uint256 => uint256) private _inventoryIndex;

    /* --------------------------------------------------------- safety */

    bool public paused;
    uint256 private _reentrancyStatus; // 0/1 = not entered, 2 = entered

    /* ---------------------------------------------------------- events */

    event SwapIn(address indexed user, uint256 indexed tokenId, uint256 priceCRNT);
    event SwapOut(address indexed user, uint256 indexed tokenId, uint256 priceCRNT);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, address indexed by);
    event ReserveFunded(address indexed by, uint256 amount);
    event ReserveWithdrawn(address indexed to, uint256 amount);
    event InventoryAdded(uint256 indexed tokenId);
    event InventoryRemoved(uint256 indexed tokenId);
    event PausedSet(bool paused);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event PriceFeederChanged(address indexed oldFeeder, address indexed newFeeder);

    /* -------------------------------------------------------- modifiers */

    modifier onlyOwner() {
        require(msg.sender == owner, "USGoldVault: not owner");
        _;
    }

    modifier onlyFeeder() {
        require(msg.sender == priceFeeder || msg.sender == owner, "USGoldVault: not feeder");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "USGoldVault: paused");
        _;
    }

    /// @dev Minimal non-reentrancy guard (avoids OZ dependency for review copy).
    modifier nonReentrant() {
        require(_reentrancyStatus != 2, "USGoldVault: reentrant");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    /* ----------------------------------------------------- constructor */

    /**
     * @param _current   Address of the Current (CRNT) ERC-20 token.
     * @param _usgold    Address of the USGold ERC-721 certificate contract.
     * @param _priceCRNT Initial Eagle price in whole CRNT (e.g. 4750).
     *
     * @dev Reverts if CRNT is not atomic (decimals != 0). This enforces the
     *      product's hard requirement at deploy time rather than discovering a
     *      scaling mismatch in production.
     */
    constructor(address _current, address _usgold, uint256 _priceCRNT) {
        require(_current != address(0) && _usgold != address(0), "USGoldVault: zero address");
        require(_priceCRNT > 0, "USGoldVault: price must be > 0");

        // Enforce atomicity of Current at deploy: decimals MUST be 0.
        require(IERC20(_current).decimals() == 0, "USGoldVault: Current must be atomic (decimals=0)");

        owner = msg.sender;
        priceFeeder = msg.sender;
        current = IERC20(_current);
        usgold = IERC721(_usgold);
        eaglePriceCRNT = _priceCRNT;
        lastPriceUpdate = block.timestamp;
        _reentrancyStatus = 1;

        emit OwnerChanged(address(0), msg.sender);
        emit PriceUpdated(0, _priceCRNT, msg.sender);
    }

    /* =====================================================================
     * SWAPS
     * ===================================================================*/

    /**
     * @notice Swap Current for one USGold certificate at the current price.
     * @dev    User must have approved this vault to spend `eaglePriceCRNT` CRNT.
     *         CEI: effects (inventory removal) happen before external transfers.
     */
    function swapIn() external whenNotPaused nonReentrant returns (uint256 tokenId) {
        uint256 price = eaglePriceCRNT;
        require(_inventory.length > 0, "USGoldVault: no certificates available");

        // Effects: pull the next certificate id from inventory (FIFO).
        tokenId = _inventory[0];
        _removeFromInventory(tokenId);

        // Interactions: pull CRNT in, then send the certificate out.
        require(
            current.transferFrom(msg.sender, address(this), price),
            "USGoldVault: CRNT transferFrom failed"
        );
        usgold.safeTransferFrom(address(this), msg.sender, tokenId);

        emit SwapIn(msg.sender, tokenId, price);
    }

    /**
     * @notice Swap one USGold certificate back for the CURRENT Eagle price in CRNT.
     * @param  tokenId The certificate the caller is returning. Caller must own it
     *         and have approved this vault to transfer it.
     * @dev    Reverts if the reserve cannot fund the payout (solvency guarantee).
     */
    function swapOut(uint256 tokenId) external whenNotPaused nonReentrant {
        uint256 price = eaglePriceCRNT;
        require(usgold.ownerOf(tokenId) == msg.sender, "USGoldVault: not token owner");

        // Solvency check BEFORE taking the certificate: never accept a cert we
        // cannot pay for.
        require(
            current.balanceOf(address(this)) >= price,
            "USGoldVault: insufficient CRNT reserve"
        );

        // Interactions: pull the certificate in (back to inventory), pay out CRNT.
        usgold.transferFrom(msg.sender, address(this), tokenId);
        _addToInventory(tokenId);

        require(current.transfer(msg.sender, price), "USGoldVault: CRNT payout failed");

        emit SwapOut(msg.sender, tokenId, price);
    }

    /* =====================================================================
     * PRICE FEED
     * ===================================================================*/

    /**
     * @notice Update the Eagle price (whole CRNT). Intended for a weekly feed.
     * @param  newPriceCRNT New price in whole CRNT.
     * @dev    Bounded by maxPriceChangeBps to limit damage from a bad update.
     */
    function setEaglePrice(uint256 newPriceCRNT) external onlyFeeder {
        require(newPriceCRNT > 0, "USGoldVault: price must be > 0");

        uint256 old = eaglePriceCRNT;
        uint256 maxDelta = (old * maxPriceChangeBps) / 10000;
        uint256 delta = newPriceCRNT > old ? newPriceCRNT - old : old - newPriceCRNT;
        require(delta <= maxDelta, "USGoldVault: price change exceeds guard");

        eaglePriceCRNT = newPriceCRNT;
        lastPriceUpdate = block.timestamp;
        emit PriceUpdated(old, newPriceCRNT, msg.sender);
    }

    /// @notice Owner can adjust the per-update guard (basis points).
    function setMaxPriceChangeBps(uint256 bps) external onlyOwner {
        require(bps <= 10000, "USGoldVault: bps > 100%");
        maxPriceChangeBps = bps;
    }

    /* =====================================================================
     * RESERVE & INVENTORY MANAGEMENT (owner)
     * ===================================================================*/

    /**
     * @notice Fund the CRNT reserve so the vault can pay swap-outs.
     * @dev    Owner must approve this vault for `amount` CRNT first.
     */
    function fundReserve(uint256 amount) external onlyOwner {
        require(amount > 0, "USGoldVault: amount = 0");
        require(current.transferFrom(msg.sender, address(this), amount), "USGoldVault: fund failed");
        emit ReserveFunded(msg.sender, amount);
    }

    /// @notice Withdraw CRNT reserve (e.g. excess liquidity). Owner only.
    function withdrawReserve(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "USGoldVault: zero address");
        require(current.balanceOf(address(this)) >= amount, "USGoldVault: insufficient reserve");
        require(current.transfer(to, amount), "USGoldVault: withdraw failed");
        emit ReserveWithdrawn(to, amount);
    }

    /**
     * @notice Register pre-minted certificates as available inventory.
     * @dev    The tokens must already have been transferred to this vault
     *         (e.g. via safeTransferFrom, which auto-registers — see
     *         onERC721Received). This explicit path covers bulk pre-mints where
     *         tokens were sent with plain transferFrom.
     */
    function addInventory(uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            require(usgold.ownerOf(id) == address(this), "USGoldVault: vault not owner of token");
            if (_inventoryIndex[id] == 0) {
                _addToInventory(id);
            }
        }
    }

    /// @notice Remove a certificate from inventory and send it to `to` (owner).
    function removeInventory(uint256 tokenId, address to) external onlyOwner {
        require(to != address(0), "USGoldVault: zero address");
        require(_inventoryIndex[tokenId] != 0, "USGoldVault: token not in inventory");
        _removeFromInventory(tokenId);
        usgold.safeTransferFrom(address(this), to, tokenId);
    }

    /* =====================================================================
     * ADMIN
     * ===================================================================*/

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedSet(_paused);
    }

    function setPriceFeeder(address feeder) external onlyOwner {
        require(feeder != address(0), "USGoldVault: zero address");
        emit PriceFeederChanged(priceFeeder, feeder);
        priceFeeder = feeder;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "USGoldVault: zero address");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    /* =====================================================================
     * VIEWS (used by the frontend dashboard / redeem / vault pages)
     * ===================================================================*/

    /// @notice How many certificates are available to swap in for.
    function availableInventory() external view returns (uint256) {
        return _inventory.length;
    }

    /// @notice CRNT currently held as reserve (available for swap-out payouts).
    function reserveBalance() external view returns (uint256) {
        return current.balanceOf(address(this));
    }

    /// @notice How many swap-outs the reserve can currently fund at today's price.
    function fundableSwapOuts() external view returns (uint256) {
        if (eaglePriceCRNT == 0) return 0;
        return current.balanceOf(address(this)) / eaglePriceCRNT;
    }

    /// @notice Read a slice of inventory tokenIds (paginated for the UI).
    function inventorySlice(uint256 start, uint256 count)
        external view returns (uint256[] memory ids)
    {
        uint256 len = _inventory.length;
        if (start >= len) return new uint256[](0);
        uint256 end = start + count;
        if (end > len) end = len;
        ids = new uint256[](end - start);
        for (uint256 i = start; i < end; i++) {
            ids[i - start] = _inventory[i];
        }
    }

    /* =====================================================================
     * ERC721 RECEIVER
     * ===================================================================*/

    /**
     * @notice Auto-register certificates sent to the vault via safeTransferFrom.
     * @dev    Only registers tokens from the configured USGold collection. This
     *         lets a bulk pre-mint use safeTransferFrom and populate inventory
     *         without a second addInventory() call.
     */
    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external override returns (bytes4)
    {
        if (msg.sender == address(usgold) && _inventoryIndex[tokenId] == 0) {
            _addToInventory(tokenId);
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    /* =====================================================================
     * INTERNAL INVENTORY HELPERS (swap-remove pattern, O(1))
     * ===================================================================*/

    function _addToInventory(uint256 tokenId) internal {
        _inventory.push(tokenId);
        _inventoryIndex[tokenId] = _inventory.length; // index + 1
        emit InventoryAdded(tokenId);
    }

    function _removeFromInventory(uint256 tokenId) internal {
        uint256 idxPlus1 = _inventoryIndex[tokenId];
        require(idxPlus1 != 0, "USGoldVault: not in inventory");
        uint256 idx = idxPlus1 - 1;
        uint256 lastIdx = _inventory.length - 1;

        if (idx != lastIdx) {
            uint256 lastToken = _inventory[lastIdx];
            _inventory[idx] = lastToken;
            _inventoryIndex[lastToken] = idx + 1;
        }
        _inventory.pop();
        _inventoryIndex[tokenId] = 0;
        emit InventoryRemoved(tokenId);
    }
}
