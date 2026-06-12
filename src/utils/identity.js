/* ============================================================================
 * FILE: src/utils/identity.js
 * PURPOSE: Shared helpers for displaying a wallet-derived "name" across pages
 *          (Home, Account, etc.) so the convention stays consistent.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.1.0  2026-06-12  Initial version.
 * ==========================================================================*/

/**
 * Short address for display, e.g. "0x123" — the "0x" plus the first 3 hex
 * characters of the address, used in place of a name throughout the UI
 * until accounts have profile names.
 */
export function walletShortName(address = '') {
    return address ? address.slice(0, 5) : '0x???';
}

/**
 * Standard "0x1234...abcd" truncated display format for full-address fields.
 */
export function walletDisplayAddress(address = '') {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
}
