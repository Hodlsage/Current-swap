/* ============================================================================
 * FILE: src/components/useMemberSince.js
 * PURPOSE: Track each wallet's first-ever login ("member since") date.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.1.0  2026-06-12  Initial version.
 * ----------------------------------------------------------------------------
 * IMPORTANT — SANDBOX / PLACEHOLDER IMPLEMENTATION
 *   This stores the first-seen timestamp in the browser's localStorage,
 *   keyed by wallet address. That means:
 *     - It is per-browser, not portable across devices.
 *     - Clearing site data / using a different browser resets it.
 *     - It is NOT a substitute for a real backend record.
 *
 *   For production, replace this with a server-side record written the first
 *   time a wallet authenticates (e.g. on first successful SIWE / signature
 *   verification), keyed by wallet address, returned via an API call. The
 *   hook's external interface (returns { memberSince, isNewMember }) is
 *   designed so that swap can happen without touching calling components.
 * ==========================================================================*/

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cur_member_since';

function readStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeStore(store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        // ignore (e.g. storage disabled)
    }
}

/**
 * @param {string|undefined} address - connected wallet address
 * @returns {{ memberSince: Date|null, isNewMember: boolean }}
 */
export function useMemberSince(address) {
    const [memberSince, setMemberSince] = useState(null);
    const [isNewMember, setIsNewMember] = useState(false);

    useEffect(() => {
        if (!address) {
            setMemberSince(null);
            setIsNewMember(false);
            return;
        }

        const key = address.toLowerCase();
        const store = readStore();

        if (store[key]) {
            setMemberSince(new Date(store[key]));
            setIsNewMember(false);
        } else {
            const now = new Date();
            store[key] = now.toISOString();
            writeStore(store);
            setMemberSince(now);
            setIsNewMember(true);
        }
    }, [address]);

    return { memberSince, isNewMember };
}
