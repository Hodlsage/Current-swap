/* ============================================================================
 * FILE: api/auth/logout.js
 * PURPOSE: Clears the session cookie. Client-side wallet disconnect (wagmi)
 *          is separate and already handled by WalletButton -- this only
 *          clears our own server-side session, since disconnecting the
 *          wallet in the browser doesn't automatically invalidate a cookie
 *          the server already issued.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created.
 * ==========================================================================*/

import { clearSessionCookie } from '../_lib/session.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    clearSessionCookie(res);
    res.status(200).json({ ok: true });
}
