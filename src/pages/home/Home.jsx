/* ============================================================================
 * FILE: src/pages/home/Home.jsx
 * PAGE: Home / Dashboard — login confirmation + session data (wagmi).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — ported to wagmi hooks. Only reachable
 *           when connected (App.jsx gate), so this always has an address.
 * ==========================================================================*/

import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useBalances } from '../../components/useBalances';
import { useMemberSince } from '../../components/useMemberSince';
import { USD_PER_CRNT, TARGET_CHAIN } from '../../config/wagmi';
import { toDisplayAmount } from '../../utils/tokenMath';
import { walletShortName, walletDisplayAddress } from '../../utils/identity';

export function Home() {
    const { address } = useAccount();
    const chainId = useChainId();
    const { currentBalance, usgoldCount, error: balanceError } = useBalances();
    const { memberSince, isNewMember } = useMemberSince(address);

    // Record the login time once per session (when this page first mounts
    // connected). Stored in component state for the session.
    const [loginTime] = useState(() => new Date());

    const sessionId = address ? address.slice(2, 10).toUpperCase() : '—';
    const loginStr = loginTime.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    const memberSinceStr = memberSince
        ? memberSince.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : '—';
    const usdValue = (Number(currentBalance) * USD_PER_CRNT)
        .toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const onTarget = chainId === TARGET_CHAIN.id;
    // When connected to the wrong chain, show the actual connected chainId
    // rather than pairing the target chain's NAME with the wrong id.
    const networkName = onTarget ? TARGET_CHAIN.name : `Unrecognized (chain ${chainId})`;

    return (
        <div className="cur-page">
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <span className="cur-badge-ok">✅ Access verified</span>
                <h2 style={{ marginTop: 16 }}>Hello, {walletShortName(address)}</h2>
                <p style={{ color: 'var(--cur-muted)', marginBottom: 0 }}>
                    {isNewMember
                        ? 'Welcome — this is your first login. '
                        : `Member since ${memberSinceStr}. `}
                    Thank you for verifying your access. Please choose an area from the menu
                    above &mdash; <strong style={{ color: 'var(--cur-gold)' }}>Redeem</strong>,{' '}
                    <strong style={{ color: 'var(--cur-gold)' }}>Account</strong>, or{' '}
                    <strong style={{ color: 'var(--cur-gold)' }}>Vault</strong>.
                </p>
            </div>

            {!onTarget && (
                <div className="cur-card" style={{ marginBottom: 22, borderColor: 'rgba(255,107,107,0.5)' }}>
                    <p style={{ color: '#ff6b6b', margin: 0 }}>
                        You are connected to chain {chainId}. Please switch to {TARGET_CHAIN.name}{' '}
                        ({TARGET_CHAIN.id}) using your wallet to view live balances.
                    </p>
                </div>
            )}

            {onTarget && balanceError && (
                <div className="cur-card" style={{ marginBottom: 22, borderColor: 'rgba(255,107,107,0.5)' }}>
                    <p style={{ color: '#ff6b6b', margin: 0 }}>
                        Could not read your balance from the network right now (the figures below
                        may show 0 even if you hold tokens). This is usually a temporary RPC
                        issue &mdash; try refreshing in a moment.
                    </p>
                </div>
            )}

            <div className="cur-grid">
                <div className="cur-stat">
                    <div className="label">Wallet Address</div>
                    <div className="value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{walletDisplayAddress(address)}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Session ID</div>
                    <div className="value gold">CUR-{sessionId}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Logged In</div>
                    <div className="value" style={{ fontSize: '1.05rem' }}>{loginStr}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Network</div>
                    <div className="value" style={{ fontSize: '1.05rem' }}>
                        {onTarget ? `${networkName} (${chainId})` : networkName}
                    </div>
                </div>
                <div className="cur-stat">
                    <div className="label">Current Balance</div>
                    <div className="value gold">{toDisplayAmount(currentBalance)} CRNT</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Estimated Value (1:1 USD)</div>
                    <div className="value">{usdValue}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">USGold Certificates</div>
                    <div className="value gold">{toDisplayAmount(usgoldCount)}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Access Level</div>
                    <div className="value">Verified Holder</div>
                </div>
            </div>
        </div>
    );
}
