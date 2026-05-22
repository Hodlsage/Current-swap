# USGold Vault — Design Specification (FUTURE WORK)

> **Status:** Specification only. Not yet implemented.
> **Revision control**
> - v0.1 — 2026-05-22 — Initial capture of the redemption-vault model from product owner.
>
> This document records the agreed direction for the USGold certificate system so
> it is not lost while the current round focuses on wallet-login + reporting. No
> code in this spec has been built yet. Do not treat any address, number, or
> interface here as final until reviewed and audited.

---

## 1. Summary

USGold is being redesigned from a **mint-on-demand NFT with a bonding-curve price
and reflection rewards** (the old `usgv2.sol`) into a **pre-minted redemption
vault** priced by an external oracle tied to the US Mint American Gold Eagle
1 oz price.

The old model is **superseded in full**. Specifically retired:

- The bonding-curve price (`cost = startPrice + (totalSupply()/250) * 5 ether`).
- On-demand `mint()` by users.
- The reflection / dividend reward system (`reflectionBalance`, `totalDividend`,
  `getReflectionBalances`, `claimRewards`).
- The `2770 ether` pricing literal (a 10^18-scaled value that conflicts with the
  atomic, 0-decimal Current token).

## 2. Tokens

| Token | Type | Decimals | Role |
|-------|------|----------|------|
| Current (CRNT) | ERC-20 | **0 (atomic, indivisible)** | The dollar instrument. 1 CRNT = 1 whole unit. Used to swap for certificates. |
| USGold Certificate | NFT (ERC-721) | n/a | A certificate for 1 oz American Gold Eagle held in custody. Pre-minted into the vault. |

**Hard requirement:** Current is atomic. All pricing math in the vault must use
whole-number CRNT (no `ether` / 10^18 scaling).

## 3. Pricing — oracle, not curve

- Price source: **US Mint American Gold Eagle 1 oz price only.**
- Stored/updated as a single whole-number CRNT value, e.g. `eaglePriceCRNT = 4750`.
- Updatable by an authorized role (owner / price feeder). Consider a timelock or
  multisig for audit-grade control.
- The same live price applies to both directions of the swap at the moment of the
  transaction.

## 4. Swap behaviour

### 4.1 Swap IN (Current → USGold)
1. User approves the vault to spend `eaglePriceCRNT` Current.
2. User calls `swapIn()`.
3. Vault pulls `eaglePriceCRNT` CRNT from the user.
4. Vault transfers **one** pre-minted USGold certificate from its inventory to the user.
5. Reverts if the vault has no certificates left in inventory.

> Example: Eagle price = 4750. User sends 4750 CRNT, receives 1 USGold certificate.

### 4.2 Swap OUT (USGold → Current)
1. User approves the vault to take their certificate (or uses `safeTransferFrom`).
2. User calls `swapOut(tokenId)`.
3. Vault takes the certificate back into inventory.
4. Vault pays the user the **current** `eaglePriceCRNT` in Current.
5. Reverts if the vault holds insufficient CRNT to pay out.

> Example: Eagle price rose to 4800. User returns the certificate, receives 4800 CRNT.

The certificate therefore tracks the live spot price of gold, settled in Current.

## 5. Open questions (resolve before building)

1. **Liquidity / solvency:** swap-out pays the *current* price. If price rises,
   the vault must hold enough CRNT to cover redemptions. Where does that CRNT come
   from — a reserve, a spread/fee, a cap? This is the central economic risk.
2. **Inventory:** how many certificates are pre-minted, and by whom?
3. **Price authority:** who can update the Eagle price, and with what safeguards
   (multisig, timelock, max-change-per-update guard against fat-finger)?
4. **Fees/spread:** is there a spread between swap-in and swap-out price?
5. **Pausing / circuit breaker:** admin pause for emergencies.
6. **Migration:** there is a LIVE deployment of the old contracts. A migration
   plan (snapshot, redeploy, reissue or wrap) is required and is its own deliverable.

## 6. Out of scope for the CURRENT round

The current development round delivers **only**:
- Web3 wallet connect used as a **login** for the Current Dollar Token.
- **Reporting** (holdings / balance display).

No mint UI, no vault UI, no swap UI is built in this round.
