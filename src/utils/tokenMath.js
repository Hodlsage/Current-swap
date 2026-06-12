/* ============================================================================
 * FILE: src/utils/tokenMath.js
 * PURPOSE: Single source of truth for Current (CRNT) token math.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Created during cleanup pass 1.
 * ----------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 *   Current is an ATOMIC token: decimals = 0. One CRNT is one indivisible unit
 *   (one US Gold dollar-instrument unit). It is NEVER fractional.
 *
 *   The original frontend treated CRNT as an 18-decimal token, calling
 *   web3.utils.fromWei(x, 'ether') (÷1e18) and toWei (×1e18) everywhere. That is
 *   WRONG for a 0-decimal token: it made the UI display a number 1e18x smaller
 *   than the value the contract actually reports on-chain, which is the core
 *   "the books don't match" bug.
 *
 *   For a 0-decimal token the raw on-chain integer IS the human amount. No
 *   scaling. These helpers make that explicit and keep BigInt-safe handling so
 *   large balances never hit JS float precision limits.
 *
 *   NOTE ON PRICING: the USG (NFT) contract historically priced mints in
 *   "ether" units (cost = 2770 ether = 2770 * 1e18). Against an atomic CRNT that
 *   1e18 multiplier is a mismatch and is corrected in the contract rewrite
 *   (see contracts/). On the frontend we read `cost` straight from the contract
 *   and treat it as a whole-CRNT integer.
 * ==========================================================================*/

/**
 * Current token decimals. Hard requirement: ATOMIC / indivisible.
 * @type {number}
 */
export const CRNT_DECIMALS = 0;

/**
 * Convert a raw on-chain token value to the human-readable amount.
 * For an atomic (0-decimal) token this is an identity transform, returned as a
 * clean integer string (no scientific notation, no fractional part).
 *
 * @param {string|number|bigint} raw - value as returned by the contract
 * @returns {string} whole-number amount, e.g. "4000"
 */
export function toDisplayAmount(raw) {
    if (raw === null || raw === undefined || raw === "") return "0";
    try {
        // BigInt handles the full uint256 range without precision loss.
        return BigInt(raw).toString();
    } catch (e) {
        // Defensive: if a non-integer slips through, floor it to stay atomic.
        const n = Math.floor(Number(raw));
        return Number.isFinite(n) ? String(n) : "0";
    }
}

/**
 * Convert a human-entered whole amount to the raw value to send on-chain.
 * For an atomic token this is also identity, but we REJECT fractional input
 * because the token cannot represent it.
 *
 * @param {string|number} amount - user-entered whole number
 * @returns {string} raw integer string suitable for contract calls
 * @throws {Error} if the amount is not a non-negative whole number
 */
export function toRawAmount(amount) {
    const s = String(amount).trim();
    if (!/^\d+$/.test(s)) {
        throw new Error(
            `Current is atomic (indivisible). "${amount}" is not a whole number.`
        );
    }
    return BigInt(s).toString();
}

/**
 * Multiply a unit cost by a count, atomically (BigInt) — used for "total CRNT
 * needed = cost * count" without floating point error.
 *
 * @param {string|number|bigint} unitCost
 * @param {string|number|bigint} count
 * @returns {string} total as an integer string
 */
export function multiplyAtomic(unitCost, count) {
    try {
        return (BigInt(unitCost) * BigInt(count)).toString();
    } catch (e) {
        return "0";
    }
}

/**
 * Compare two atomic amounts. Returns true if `have` >= `need`.
 * @param {string|number|bigint} have
 * @param {string|number|bigint} need
 * @returns {boolean}
 */
export function hasEnough(have, need) {
    try {
        return BigInt(have) >= BigInt(need);
    } catch (e) {
        return false;
    }
}
