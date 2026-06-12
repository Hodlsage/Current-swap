// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/* ============================================================================
 *  ██████╗██╗   ██╗██████╗ ██████╗ ███████╗███╗   ██╗████████╗
 * ██╔════╝██║   ██║██╔══██╗██╔══██╗██╔════╝████╗  ██║╚══██╔══╝
 * ██║     ██║   ██║██████╔╝██████╔╝█████╗  ██╔██╗ ██║   ██║
 * ██║     ██║   ██║██╔══██╗██╔══██╗██╔══╝  ██║╚██╗██║   ██║
 * ╚██████╗╚██████╔╝██║  ██║██║  ██║███████╗██║ ╚████║   ██║
 *  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝
 * ----------------------------------------------------------------------------
 * FILE:      Current.sol
 * CONTRACT:  Current  (symbol: CRNT)
 * TYPE:      Custom atomic ERC-20 dollar instrument (NO external libraries)
 * AUTHOR:    Current Network
 * LICENSE:   MIT
 * SOLC:      0.8.24 (pinned exact — no floating pragma, per audit best practice)
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  First production-candidate rewrite.
 *     - Complete custom implementation. Deliberately NO OpenZeppelin: every
 *       primitive (ERC-20 logic, roles, pause, reentrancy guard) is hand-written
 *       and inline so the entire trust surface is in one auditable file.
 *     - ATOMIC: decimals() == 0. 1 CRNT is one indivisible whole unit ($1 peg).
 *     - Supply model: role-gated mint + burn; the Vault can be granted minter
 *       rights for gold-backed issuance.
 *     - Access control: owner / minter / pauser roles + TWO-STEP ownership
 *       transfer (pending-accept) so ownership cannot be lost to a typo.
 *     - Controls: emergency pause (halts transfers) + per-address freeze
 *       (compliance), both role-gated and fully event-logged.
 * ----------------------------------------------------------------------------
 * DESIGN RATIONALE (why each choice — auditors read this section)
 *   1. SafeMath is intentionally OMITTED. Solidity >= 0.8 reverts on overflow/
 *      underflow at the language level, so SafeMath is redundant bytecode. We
 *      rely on built-in checked arithmetic. (Documented so a reviewer does not
 *      flag the absence as an oversight.)
 *   2. decimals = 0 is a PRODUCT REQUIREMENT, not an accident. Current is an
 *      atomic dollar instrument. A constant, not a constructor arg, so it can
 *      never be deployed wrong.
 *   3. Admin powers (mint, pause, freeze) are INTENTIONAL and appropriate for a
 *      regulated-style stablecoin. They are centralization trade-offs by design;
 *      every privileged action emits an event for off-chain monitoring.
 *   4. No fallback/receive: the contract must never custody native BNB.
 * ==========================================================================*/

/* ----------------------------------------------------------------------------
 * IERC20 — the standard interface this token implements. Declared locally so
 * the file has zero external imports (the entire trust surface is in-file).
 * --------------------------------------------------------------------------*/
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/* ----------------------------------------------------------------------------
 * IERC20Metadata — optional-but-expected name/symbol/decimals view extension.
 * --------------------------------------------------------------------------*/
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

/* ============================================================================
 * Current
 * ==========================================================================*/
contract Current is IERC20Metadata {

    /* =====================================================================
     * STORAGE
     * ===================================================================*/

    /* --- ERC-20 core ---------------------------------------------------- */
    string  private constant _NAME = "Current";
    string  private constant _SYMBOL = "CRNT";

    /// @dev ATOMIC TOKEN. Indivisible. This is a hard product invariant and is
    ///      a constant so it cannot be misconfigured at deploy time.
    uint8   private constant _DECIMALS = 0;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    /* --- Roles (custom, no library) ------------------------------------- */
    /// @notice Top-level admin. Manages roles, controls, and ownership handoff.
    address public owner;
    /// @notice Pending owner for the two-step ownership transfer.
    address public pendingOwner;
    /// @notice Addresses permitted to mint (e.g. the treasury and the Vault).
    mapping(address => bool) public isMinter;
    /// @notice Addresses permitted to pause/unpause and freeze/unfreeze.
    mapping(address => bool) public isPauser;

    /* --- Controls ------------------------------------------------------- */
    /// @notice When true, all transfers/mints/burns are halted (emergency).
    bool public paused;
    /// @notice Addresses that cannot send or receive (compliance/theft/court).
    mapping(address => bool) public isFrozen;

    /* --- Reentrancy guard (custom, minimal) ----------------------------- */
    uint256 private _entered; // 1 = not entered, 2 = entered

    /* =====================================================================
     * EVENTS  (every privileged action is logged for monitoring)
     * ===================================================================*/
    event Mint(address indexed to, uint256 amount, address indexed by);
    event Burn(address indexed from, uint256 amount, address indexed by);
    event MinterSet(address indexed account, bool enabled, address indexed by);
    event PauserSet(address indexed account, bool enabled, address indexed by);
    event Paused(bool status, address indexed by);
    event AddressFrozen(address indexed account, bool frozen, address indexed by);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /* =====================================================================
     * MODIFIERS
     * ===================================================================*/

    modifier onlyOwner() {
        require(msg.sender == owner, "Current: caller is not owner");
        _;
    }

    modifier onlyMinter() {
        require(isMinter[msg.sender], "Current: caller is not a minter");
        _;
    }

    modifier onlyPauser() {
        // Owner is always implicitly a pauser for emergency response.
        require(isPauser[msg.sender] || msg.sender == owner, "Current: caller is not a pauser");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Current: token is paused");
        _;
    }

    /// @dev Minimal custom non-reentrancy guard (no library dependency).
    modifier nonReentrant() {
        require(_entered != 2, "Current: reentrant call");
        _entered = 2;
        _;
        _entered = 1;
    }

    /* =====================================================================
     * CONSTRUCTOR
     * ===================================================================*/

    /**
     * @param initialSupply  Whole-unit CRNT minted to the deployer at launch
     *                        (atomic: pass the literal token count, e.g. 0 or
     *                        an initial treasury amount). May be 0.
     * @dev The deployer becomes owner, the first minter, and the first pauser.
     */
    constructor(uint256 initialSupply) {
        owner = msg.sender;
        isMinter[msg.sender] = true;
        isPauser[msg.sender] = true;
        _entered = 1;

        emit OwnershipTransferred(address(0), msg.sender);
        emit MinterSet(msg.sender, true, msg.sender);
        emit PauserSet(msg.sender, true, msg.sender);

        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    /* =====================================================================
     * ERC-20 METADATA VIEWS
     * ===================================================================*/

    function name() external pure override returns (string memory) { return _NAME; }
    function symbol() external pure override returns (string memory) { return _SYMBOL; }

    /// @notice ATOMIC token — always 0. 1 CRNT is indivisible and worth $1.
    function decimals() external pure override returns (uint8) { return _DECIMALS; }

    function totalSupply() external view override returns (uint256) { return _totalSupply; }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner_, address spender) external view override returns (uint256) {
        return _allowances[owner_][spender];
    }

    /* =====================================================================
     * ERC-20 TRANSFERS
     * ===================================================================*/

    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 current = _allowances[from][msg.sender];
        // type(uint256).max is treated as an "infinite" allowance and is NOT
        // decremented — a common, gas-saving, audit-recognised pattern.
        if (current != type(uint256).max) {
            require(current >= amount, "Current: insufficient allowance");
            unchecked { _approve(from, msg.sender, current - amount); }
        }
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Safer allowance change helpers (mitigate the classic ERC-20
     *         approve race condition vs. setting a new non-zero allowance).
     */
    function increaseAllowance(address spender, uint256 added) external returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender] + added);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtracted) external returns (bool) {
        uint256 current = _allowances[msg.sender][spender];
        require(current >= subtracted, "Current: decreased allowance below zero");
        unchecked { _approve(msg.sender, spender, current - subtracted); }
        return true;
    }

    /* =====================================================================
     * MINT / BURN  (role-gated supply management)
     * ===================================================================*/

    /**
     * @notice Mint new CRNT to `to`. Restricted to minters (treasury / Vault).
     * @dev Atomic units. Emits Mint and the ERC-20 Transfer-from-zero.
     */
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused nonReentrant {
        _mint(to, amount);
        emit Mint(to, amount, msg.sender);
    }

    /**
     * @notice Burn CRNT from the caller's own balance.
     */
    function burn(uint256 amount) external whenNotPaused nonReentrant {
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount, msg.sender);
    }

    /**
     * @notice Burn CRNT from `from` using the caller's allowance (e.g. Vault
     *         redemptions). Restricted to minters to prevent griefing.
     */
    function burnFrom(address from, uint256 amount) external onlyMinter whenNotPaused nonReentrant {
        uint256 current = _allowances[from][msg.sender];
        if (current != type(uint256).max) {
            require(current >= amount, "Current: insufficient allowance");
            unchecked { _approve(from, msg.sender, current - amount); }
        }
        _burn(from, amount);
        emit Burn(from, amount, msg.sender);
    }

    /* =====================================================================
     * ADMIN — ROLES
     * ===================================================================*/

    function setMinter(address account, bool enabled) external onlyOwner {
        require(account != address(0), "Current: zero address");
        isMinter[account] = enabled;
        emit MinterSet(account, enabled, msg.sender);
    }

    function setPauser(address account, bool enabled) external onlyOwner {
        require(account != address(0), "Current: zero address");
        isPauser[account] = enabled;
        emit PauserSet(account, enabled, msg.sender);
    }

    /* =====================================================================
     * ADMIN — CONTROLS (pause + freeze)
     * ===================================================================*/

    function setPaused(bool status) external onlyPauser {
        paused = status;
        emit Paused(status, msg.sender);
    }

    function setFrozen(address account, bool frozen) external onlyPauser {
        require(account != address(0), "Current: zero address");
        isFrozen[account] = frozen;
        emit AddressFrozen(account, frozen, msg.sender);
    }

    /* =====================================================================
     * ADMIN — TWO-STEP OWNERSHIP TRANSFER
     *   Step 1: current owner nominates a new owner.
     *   Step 2: the nominee must call acceptOwnership().
     *   This prevents transferring ownership to a wrong/unreachable address.
     * ===================================================================*/

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Current: zero address");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Current: caller is not pending owner");
        address previous = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(previous, owner);
    }

    /**
     * @notice Permanently renounce ownership (no owner thereafter). Irreversible.
     * @dev Provided for full decentralisation if/when desired. Guarded by a
     *      magic argument so it cannot be triggered by accident.
     */
    function renounceOwnership(bytes32 confirmation) external onlyOwner {
        require(confirmation == keccak256("I_UNDERSTAND_THIS_IS_PERMANENT"), "Current: bad confirmation");
        address previous = owner;
        owner = address(0);
        pendingOwner = address(0);
        emit OwnershipTransferred(previous, address(0));
    }

    /* =====================================================================
     * INTERNAL LOGIC  (single source of truth for state changes)
     * ===================================================================*/

    function _transfer(address from, address to, uint256 amount) internal whenNotPaused {
        require(from != address(0), "Current: transfer from zero");
        require(to != address(0), "Current: transfer to zero");
        require(!isFrozen[from], "Current: sender frozen");
        require(!isFrozen[to], "Current: recipient frozen");

        uint256 fromBal = _balances[from];
        require(fromBal >= amount, "Current: insufficient balance");

        unchecked {
            _balances[from] = fromBal - amount;   // safe: checked fromBal >= amount
            _balances[to] += amount;              // safe: total supply bounds it
        }
        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Current: mint to zero");
        require(!isFrozen[to], "Current: recipient frozen");
        _totalSupply += amount;                   // 0.8.x checked add
        unchecked { _balances[to] += amount; }    // bounded by _totalSupply
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "Current: burn from zero");
        uint256 bal = _balances[from];
        require(bal >= amount, "Current: burn exceeds balance");
        unchecked {
            _balances[from] = bal - amount;
            _totalSupply -= amount;               // safe: bal >= amount <= supply
        }
        emit Transfer(from, address(0), amount);
    }

    function _approve(address owner_, address spender, uint256 amount) internal {
        require(owner_ != address(0), "Current: approve from zero");
        require(spender != address(0), "Current: approve to zero");
        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }
}
