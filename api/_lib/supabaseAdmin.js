/* ============================================================================
 * FILE: api/_lib/supabaseAdmin.js
 * PURPOSE: Server-only Supabase client using the service_role key (full DB
 *          access, bypasses Row Level Security). This file must NEVER be
 *          imported from client-side code -- it lives under api/ specifically
 *          so it only ever runs in Vercel's serverless functions.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created. Every query made with this client MUST
 *           include an explicit .eq('wallet_address', address) filter scoped
 *           to the verified session -- this client bypasses RLS entirely, so
 *           the RLS policy on `profiles` is a defense-in-depth backstop, not
 *           the primary enforcement (that's the session verification in
 *           session.js + the explicit filters in profile.js).
 * ==========================================================================*/

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in the environment.');
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});
