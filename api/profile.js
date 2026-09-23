/* ============================================================================
 * FILE: api/profile.js
 * PURPOSE: GET/POST the signed-in wallet's own off-chain profile (nickname,
 *          kyc_status, preferences). Scoped entirely to whichever wallet is
 *          proven by the session cookie -- there is no way to read or write
 *          another wallet's row through this endpoint.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created.
 * ----------------------------------------------------------------------------
 * kyc_status IS DELIBERATELY READ-ONLY HERE. Per client decision, KYC is a
 * plain field an admin sets manually for now (no verification provider
 * integrated yet). POST only accepts `nickname` and `preferences` --
 * `kyc_status` in the request body is ignored even if present, so a wallet
 * can never verify itself. A separate admin-only tool/endpoint (not built
 * yet) is the intended way to change it later.
 * ==========================================================================*/

import { readSessionCookie } from './_lib/session.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
    const walletAddress = readSessionCookie(req);
    if (!walletAddress) {
        res.status(401).json({ error: 'Not signed in.' });
        return;
    }

    if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('wallet_address, nickname, kyc_status, preferences, created_at')
            .eq('wallet_address', walletAddress)
            .single();

        if (error) {
            res.status(500).json({ error: 'Could not load profile.' });
            return;
        }
        res.status(200).json(data);
        return;
    }

    if (req.method === 'POST') {
        const { nickname, preferences } = req.body || {};

        // Build the update from only the allowed fields -- kyc_status is
        // never accepted from the client, regardless of what's in the body.
        const update = { updated_at: new Date().toISOString() };
        if (typeof nickname === 'string') update.nickname = nickname.slice(0, 60);
        if (preferences && typeof preferences === 'object') update.preferences = preferences;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(update)
            .eq('wallet_address', walletAddress)
            .select('wallet_address, nickname, kyc_status, preferences, created_at')
            .single();

        if (error) {
            res.status(500).json({ error: 'Could not save profile.' });
            return;
        }
        res.status(200).json(data);
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
