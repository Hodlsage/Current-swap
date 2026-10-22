/* ============================================================================
 * FILE: api/admin/deposits.js
 * PURPOSE: Admin-only. GET list deposits (optionally ?wallet=0x..), POST
 *          { action: 'create', ... } to record money in, POST
 *          { action: 'void', id, reason } to void a mistake. Nothing is ever
 *          hard-deleted -- voided rows stay on record and stop counting.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-10-22  Created. Access = session wallet listed in the
 *           ADMIN_WALLETS env var; anyone else gets 403.
 * ==========================================================================*/

import { readSessionCookie } from '../_lib/session.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { isAdminWallet } from '../_lib/admin.js';
import { validateDeposit, withRunningTotals } from '../_lib/ledger.js';

const COLS = 'id, wallet_address, amount_usd, method, reference, received_at, status, void_reason, voided_at, created_by, created_at';

export default async function handler(req, res) {
    try {
        const admin = readSessionCookie(req);
        if (!admin) return res.status(401).json({ error: 'Not signed in.' });
        if (!isAdminWallet(admin)) return res.status(403).json({ error: 'Admin only.' });

        if (req.method === 'GET') {
            let q = supabaseAdmin.from('deposits').select(COLS).limit(2000);
            const w = String(req.query?.wallet || '').trim().toLowerCase();
            if (w) q = q.eq('wallet_address', w);
            const { data, error } = await q;
            if (error) return res.status(500).json({ error: 'Could not load deposits.' });
            const { rows, totals } = withRunningTotals(data || []);
            return res.status(200).json({ deposits: rows, totals });
        }

        if (req.method === 'POST') {
            const body = req.body || {};

            if (body.action === 'create') {
                const { error: bad, value } = validateDeposit(body);
                if (bad) return res.status(400).json({ error: bad });
                const { data, error } = await supabaseAdmin
                    .from('deposits')
                    .insert({ ...value, status: 'active', created_by: admin })
                    .select(COLS)
                    .single();
                if (error) return res.status(500).json({ error: 'Could not save deposit.' });
                return res.status(200).json(data);
            }

            if (body.action === 'void') {
                const id = String(body.id || '');
                if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Bad deposit id.' });
                const reason = String(body.reason || '').trim().slice(0, 200);
                if (!reason) return res.status(400).json({ error: 'Enter a reason for voiding.' });
                const { data, error } = await supabaseAdmin
                    .from('deposits')
                    .update({ status: 'voided', void_reason: reason, voided_at: new Date().toISOString() })
                    .eq('id', id)
                    .eq('status', 'active')
                    .select(COLS)
                    .single();
                if (error || !data) return res.status(404).json({ error: 'Deposit not found or already voided.' });
                return res.status(200).json(data);
            }

            return res.status(400).json({ error: 'Unknown action.' });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        res.status(500).json({ error: 'Server error.' });
    }
}
