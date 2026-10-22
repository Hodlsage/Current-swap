/* ============================================================================
 * FILE: api/_lib/ledger.js
 * PURPOSE: Money In helpers -- cents math, validation, and rolling totals.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-10-22  Created for the Money In / Admin deposits feature.
 * ----------------------------------------------------------------------------
 * Amounts are handled as whole CENTS internally so rolling totals never pick
 * up floating point drift. VOIDED rows stay on record but never count.
 * ==========================================================================*/

export const METHODS = ['wire', 'ach', 'stablecoin', 'other'];
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function toCents(amount) {
    return Math.round(Number(amount) * 100);
}

/** Adds rolling totals PER WALLET (oldest -> newest), returns newest first. */
export function withRunningTotals(rows) {
    const asc = [...rows].sort((a, b) =>
        a.received_at.localeCompare(b.received_at) ||
        String(a.created_at).localeCompare(String(b.created_at)));
    const totals = {};
    const out = asc.map((r) => {
        const w = r.wallet_address;
        if (!(w in totals)) totals[w] = 0;
        if (r.status === 'active') totals[w] += toCents(r.amount_usd);
        return { ...r, running_total: totals[w] / 100 };
    });
    return { rows: out.reverse(), totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / 100])) };
}

/** Validates an admin "create deposit" body. Returns { error } or { value }. */
export function validateDeposit(body) {
    const b = body || {};
    const wallet = String(b.wallet || '').trim();
    if (!ADDRESS_RE.test(wallet)) return { error: 'Enter a valid wallet address (0x + 40 characters).' };

    const cents = toCents(b.amount);
    if (!Number.isFinite(cents) || cents <= 0) return { error: 'Amount must be greater than 0.' };
    if (cents > 1_000_000_000 * 100) return { error: 'Amount is too large.' };

    if (!METHODS.includes(b.method)) return { error: 'Pick a method: wire, ACH, stablecoin or other.' };

    const date = String(b.received_at || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z'))) {
        return { error: 'Enter the date received.' };
    }
    if (Date.parse(date + 'T00:00:00Z') > Date.now() + 2 * 86400000) {
        return { error: 'Date cannot be in the future.' };
    }

    return {
        value: {
            wallet_address: wallet.toLowerCase(),
            amount_usd: cents / 100,
            method: b.method,
            reference: String(b.reference || '').trim().slice(0, 200) || null,
            received_at: date,
        },
    };
}
