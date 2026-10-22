/* ============================================================================
 * FILE: api/deposits.js
 * PURPOSE: GET the signed-in wallet's own Money In list (active deposits only)
 *          with rolling totals. Scoped to the session wallet -- no way to read
 *          anyone else's deposits here.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-10-22  Created.
 * ==========================================================================*/

import { readSessionCookie } from './_lib/session.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { withRunningTotals } from './_lib/ledger.js';

export default async function handler(req, res) {
    try {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

        const wallet = readSessionCookie(req);
        if (!wallet) return res.status(401).json({ error: 'Not signed in.' });

        const { data, error } = await supabaseAdmin
            .from('deposits')
            .select('id, wallet_address, amount_usd, method, reference, received_at, status, created_at')
            .eq('wallet_address', wallet)
            .eq('status', 'active');
        if (error) return res.status(500).json({ error: 'Could not load deposits.' });

        const { rows, totals } = withRunningTotals(data || []);
        res.status(200).json({ deposits: rows, total: totals[wallet] || 0 });
    } catch (e) {
        res.status(500).json({ error: 'Could not load deposits.' });
    }
}
