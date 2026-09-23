/* ============================================================================
 * FILE: api/_lib/session.js
 * PURPOSE: Shared helpers for the wallet-based session -- signing/verifying
 *          our own short-lived JWTs (used both for the SIWE nonce token and
 *          the actual login session cookie), and reading/writing the
 *          session cookie itself.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created for the wallet-login (SIWE) + Supabase
 *           profile feature (nickname, kyc_status, preferences).
 * ----------------------------------------------------------------------------
 * WHY A SEPARATE SECRET FROM SUPABASE
 *   SESSION_JWT_SECRET signs two different things: (1) the short-lived nonce
 *   token handed out by /api/auth/nonce (proves "we really issued this nonce
 *   recently", since serverless functions have no memory between calls --
 *   no server-side nonce store needed), and (2) the actual login session
 *   cookie after a wallet signs in. Keeping this separate from
 *   SUPABASE_SERVICE_ROLE_KEY means a leak of one secret doesn't also
 *   compromise the other.
 * ==========================================================================*/

import jwt from 'jsonwebtoken';

const SESSION_SECRET = process.env.SESSION_JWT_SECRET;
const NONCE_TTL_SECONDS = 5 * 60;       // nonce token: 5 minutes to complete sign-in
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // session cookie: 7 days

if (!SESSION_SECRET) {
    // Fails loudly at request time (via the functions that import this)
    // rather than silently signing with `undefined`.
    console.error('SESSION_JWT_SECRET is not set in the environment.');
}

export function signNonceToken(nonce) {
    return jwt.sign({ nonce }, SESSION_SECRET, { expiresIn: NONCE_TTL_SECONDS });
}

export function verifyNonceToken(token) {
    try {
        const payload = jwt.verify(token, SESSION_SECRET);
        return payload.nonce;
    } catch {
        return null; // expired, tampered, or malformed -- caller treats as invalid
    }
}

export function signSessionToken(walletAddress) {
    return jwt.sign({ sub: walletAddress.toLowerCase() }, SESSION_SECRET, {
        expiresIn: SESSION_TTL_SECONDS,
    });
}

export function verifySessionToken(token) {
    try {
        const payload = jwt.verify(token, SESSION_SECRET);
        return payload.sub || null;
    } catch {
        return null;
    }
}

const COOKIE_NAME = 'cur_session';

/** Manual cookie parsing -- avoids pulling in a whole cookie-parser dependency
 *  for one simple key/value read. */
export function readSessionCookie(req) {
    const header = req.headers.cookie;
    if (!header) return null;
    const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    const token = match.slice(COOKIE_NAME.length + 1);
    return verifySessionToken(token);
}

export function setSessionCookie(res, token) {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const parts = [
        `${COOKIE_NAME}=${token}`,
        'Path=/',
        `Max-Age=${SESSION_TTL_SECONDS}`,
        'HttpOnly',
        'SameSite=Lax',
    ];
    if (isProd) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}
