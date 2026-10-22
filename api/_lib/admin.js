/* ============================================================================
 * FILE: api/_lib/admin.js
 * PURPOSE: Decides whether a signed-in wallet is an admin. Admins are listed
 *          in the ADMIN_WALLETS env var (comma-separated addresses) in Vercel.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-10-22  Created.
 * ==========================================================================*/

export function isAdminWallet(wallet) {
    if (!wallet) return false;
    const list = (process.env.ADMIN_WALLETS || '')
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
    return list.includes(String(wallet).toLowerCase());
}
