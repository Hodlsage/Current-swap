/* ============================================================================
 * FILE: api/auth/nonce.js
 * PURPOSE: Step 1 of wallet sign-in. Issues a random nonce for the client to
 *          embed in the message it asks the wallet to sign, plus a signed
 *          token proving WE issued it (see _lib/session.js for why -- no
 *          server-side nonce storage needed, since the token itself is the
 *          proof and self-expires in 5 minutes).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created.
 * ==========================================================================*/

import crypto from 'crypto';
import { signNonceToken } from '../_lib/session.js';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const token = signNonceToken(nonce);

    res.status(200).json({ nonce, token });
}
