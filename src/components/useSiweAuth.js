/* ============================================================================
 * FILE: src/components/useSiweAuth.js
 * PURPOSE: Drives the wallet sign-in flow (nonce -> sign -> verify) and
 *          tracks whether the connected wallet currently has a valid
 *          server-side session. This is separate from wagmi's isConnected --
 *          a wallet can be CONNECTED (the browser knows the address) without
 *          being SIGNED IN (the server has verified a signature and issued a
 *          session cookie). Profile data requires the latter.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created.
 * ==========================================================================*/

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

export function useSiweAuth() {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();

    const [status, setStatus] = useState('checking'); // checking | signed_out | signing_in | signed_in | error
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(null);

    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/profile', { credentials: 'include' });
            if (res.status === 401) {
                setStatus('signed_out');
                setProfile(null);
                return;
            }
            if (!res.ok) throw new Error('Failed to load profile');
            const data = await res.json();
            setProfile(data);
            setStatus('signed_in');
        } catch (e) {
            setStatus('signed_out');
            setProfile(null);
        }
    }, []);

    // On mount (and whenever the connected address changes), check whether
    // we already have a valid session -- avoids re-prompting a signature on
    // every page load/refresh.
    useEffect(() => {
        if (!isConnected) {
            setStatus('signed_out');
            setProfile(null);
            return;
        }
        loadProfile();
    }, [isConnected, address, loadProfile]);

    const signIn = useCallback(async () => {
        if (!address) return;
        setStatus('signing_in');
        setError(null);
        try {
            const nonceRes = await fetch('/api/auth/nonce');
            if (!nonceRes.ok) throw new Error('Could not start sign-in.');
            const { nonce, token } = await nonceRes.json();

            const domain = window.location.host;
            const message =
                `${domain} wants you to sign in with your Ethereum account:\n` +
                `${address}\n\n` +
                `Sign this message to verify wallet ownership. This is free and does not send a transaction.\n\n` +
                `URI: ${window.location.origin}\n` +
                `Nonce: ${nonce}\n` +
                `Issued At: ${new Date().toISOString()}`;

            const signature = await signMessageAsync({ message });

            const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message, signature, token, address }),
            });

            if (!verifyRes.ok) {
                const body = await verifyRes.json().catch(() => ({}));
                throw new Error(body.error || 'Sign-in failed.');
            }

            await loadProfile();
        } catch (e) {
            setError(e.message || 'Sign-in failed.');
            setStatus('signed_out');
        }
    }, [address, signMessageAsync, loadProfile]);

    const signOut = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        setStatus('signed_out');
        setProfile(null);
    }, []);

    const saveProfile = useCallback(async (updates) => {
        const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Could not save profile.');
        const data = await res.json();
        setProfile(data);
        return data;
    }, []);

    return { status, error, profile, signIn, signOut, saveProfile };
}
