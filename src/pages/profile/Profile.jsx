/* ============================================================================
 * FILE: src/pages/profile/Profile.jsx
 * PAGE: Profile — nickname, KYC status (read-only), and preferences. First
 *       page to use off-chain data (Supabase) rather than only contract
 *       reads. Requires a signed-in session (SIWE), not just a connected
 *       wallet -- RequireWallet in App.jsx handles "is a wallet connected"
 *       already; this page additionally needs "has that wallet signed a
 *       verification message", which is a separate, stronger check.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created.
 * ==========================================================================*/

import React, { useEffect, useState } from 'react';
import { useSiweAuth } from '../../components/useSiweAuth';

const KYC_LABELS = {
    not_started: 'Not started',
    pending: 'Pending review',
    verified: 'Verified',
    rejected: 'Not approved',
};

const KYC_COLORS = {
    not_started: 'var(--cur-muted)',
    pending: '#f5c518',
    verified: '#4ade80',
    rejected: '#ff6b6b',
};

export function Profile() {
    const { status, error, profile, signIn, saveProfile } = useSiweAuth();
    const [nickname, setNickname] = useState('');
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error

    useEffect(() => {
        if (profile) {
            setNickname(profile.nickname || '');
            setEmailUpdates(!!profile.preferences?.emailUpdates);
        }
    }, [profile]);

    const handleSave = async () => {
        setSaveState('saving');
        try {
            await saveProfile({
                nickname,
                preferences: { ...(profile?.preferences || {}), emailUpdates },
            });
            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 2000);
        } catch {
            setSaveState('error');
        }
    };

    if (status === 'checking') {
        return (
            <div className="cur-page">
                <div className="cur-card">
                    <p style={{ color: 'var(--cur-muted)', margin: 0 }}>Checking sign-in status...</p>
                </div>
            </div>
        );
    }

    if (status === 'signed_out' || status === 'signing_in') {
        return (
            <div className="cur-page">
                <div className="cur-card" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
                    <h2 style={{ marginTop: 0 }}>Verify your wallet</h2>
                    <p style={{ color: 'var(--cur-muted)' }}>
                        Your profile (nickname, KYC status, preferences) is protected by a signed
                        message from your wallet — not just a connection. This is free and does
                        not send a transaction.
                    </p>
                    {error && (
                        <p style={{ color: '#ff6b6b', fontSize: '.9rem' }}>{error}</p>
                    )}
                    <button
                        className="cur-btn cur-btn--solid"
                        onClick={signIn}
                        disabled={status === 'signing_in'}
                    >
                        {status === 'signing_in' ? 'Check your wallet...' : 'Sign in to view profile'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cur-page">
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <h2 style={{ marginTop: 0 }}>Your Profile</h2>
                <p style={{ color: 'var(--cur-muted)', marginBottom: 0 }}>
                    This information is private to your wallet — no one else can view or edit it.
                </p>
            </div>

            <div className="cur-card" style={{ marginBottom: 22 }}>
                <div style={{ display: 'grid', gap: 14, maxWidth: 480 }}>
                    <label>
                        <div className="redeem-label">Nickname</div>
                        <input
                            className="redeem-input"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="How should we address you?"
                            maxLength={60}
                        />
                    </label>

                    <div>
                        <div className="redeem-label">KYC Status</div>
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '6px 14px',
                                borderRadius: 999,
                                fontWeight: 600,
                                fontSize: '.9rem',
                                color: KYC_COLORS[profile?.kyc_status] || 'var(--cur-muted)',
                                border: `1px solid ${KYC_COLORS[profile?.kyc_status] || 'var(--cur-muted)'}`,
                            }}
                        >
                            {KYC_LABELS[profile?.kyc_status] || 'Not started'}
                        </span>
                        <p style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 8, marginBottom: 0 }}>
                            Set by our compliance team — not editable here. Complete KYC via{' '}
                            <strong style={{ color: 'var(--cur-gold)' }}>Redeem</strong> if you haven't yet.
                        </p>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                            type="checkbox"
                            checked={emailUpdates}
                            onChange={(e) => setEmailUpdates(e.target.checked)}
                        />
                        <span>Email me about account updates</span>
                    </label>

                    <button
                        className="cur-btn cur-btn--solid"
                        onClick={handleSave}
                        disabled={saveState === 'saving'}
                        style={{ width: 'fit-content' }}
                    >
                        {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save Changes'}
                    </button>
                    {saveState === 'error' && (
                        <p style={{ color: '#ff6b6b', fontSize: '.85rem', margin: 0 }}>
                            Could not save. Please try again.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
