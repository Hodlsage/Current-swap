/* ============================================================================
 * FILE: api/auth/verify.js
 * PURPOSE: Step 2 of wallet sign-in. Client posts the message it had the
 *          wallet sign, the resulting signature, and the nonce token from
 *          /api/auth/nonce. This verifies all of it, then:
 *            - creates a `profiles` row for this wallet if one doesn't
 *              exist yet (first-ever login -- this is the "folder gets
 *              created" behavior)
 *            - issues a session cookie so the client stays signed in
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created.
 * ==========================================================================*/

import { verifyMessage } from 'viem';
import { verifyNonceToken, signSessionToken, setSessionCookie } from '../_lib/session.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { message, signature, token, address } = req.body || {};

    if (!message || !signature || !token || !address) {
        res.status(400).json({ error: 'Missing message, signature, token, or address.' });
        return;
    }

    // 1. Confirm the nonce token is genuinely one we issued recently (not
    //    expired, not tampered with -- see _lib/session.js).
    const nonce = verifyNonceToken(token);
    if (!nonce) {
        res.status(401).json({ error: 'Sign-in request expired or invalid. Please try again.' });
        return;
    }

    // 2. The nonce must actually appear in the signed message text -- this
    //    stops someone from taking a valid token and pairing it with a
    //    DIFFERENT message than the one the nonce was issued for.
    if (!message.includes(nonce)) {
        res.status(401).json({ error: 'Message does not match the sign-in request.' });
        return;
    }

    // 3. The real cryptographic check: does `signature` actually prove that
    //    `address` signed exactly this `message`?
    let isValid = false;
    try {
        isValid = await verifyMessage({ address, message, signature });
    } catch {
        isValid = false;
    }

    if (!isValid) {
        res.status(401).json({ error: 'Signature verification failed.' });
        return;
    }

    const walletAddress = address.toLowerCase();

    // 4. First-ever login for this wallet creates its profile row
    //    automatically -- equivalent to "the folder gets created the first
    //    time this wallet logs in". Subsequent logins are a no-op here
    //    since the row already exists.
    const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({ wallet_address: walletAddress }, { onConflict: 'wallet_address', ignoreDuplicates: true });

    if (upsertError) {
        res.status(500).json({ error: 'Could not create or load your profile. Please try again.' });
        return;
    }

    // 5. Sign in: issue the session cookie.
    const sessionToken = signSessionToken(walletAddress);
    setSessionCookie(res, sessionToken);

    res.status(200).json({ walletAddress });
}
