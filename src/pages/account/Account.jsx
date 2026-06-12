/* ============================================================================
 * FILE: src/pages/account/Account.jsx
 * PAGE: Account — friendly balance summary + CRNT/USGold holdings + account
 *       profile detail (wagmi).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — ported to wagmi hooks.
 *   v1.1.0  2026-06-12  Account profile section added:
 *           - "Your Account" -> "0x123's Account" (first 5 chars of wallet,
 *             via utils/identity.walletShortName), matching Home's greeting.
 *           - "Member since" date, from useMemberSince (first-ever login,
 *             see that file's header for the localStorage caveat).
 *           - Full wallet address, network, and a combined portfolio total
 *             (CRNT value + USGold value at current Eagle price) added.
 *   v1.2.0  2026-06-12  Added a friendly, non-technical summary section at the
 *           top of the page ("Your Balance" / plain-English explanation of
 *           CRNT and USGold) aimed at early adopters who aren't crypto-native.
 *           The existing wallet/network/profile details remain below for users
 *           who want them, but are no longer the first thing shown.
 *           NOTE: USGold remains the name of the gold-backing token for now
 *           (it backs CRNT). A future "Current Gold Cert" / NFT-based v2 of
 *           the gold side is a separate, later effort — not reflected here.
 * ==========================================================================*/

import React from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { useBalances } from '../../components/useBalances';
import { useMemberSince } from '../../components/useMemberSince';
import { USD_PER_CRNT, TARGET_CHAIN, getAddressesForChain } from '../../config/wagmi';
import { VAULT_ABI } from '../../contracts/abis';
import { LEGACY_VAULT_REFERENCE } from '../../config/legacyVaultData';
import { toDisplayAmount } from '../../utils/tokenMath';
import { walletShortName, walletDisplayAddress } from '../../utils/identity';

export function Account() {
    const { address } = useAccount();
    const chainId = useChainId();
    const { currentBalance, usgoldCount, loading, refresh } = useBalances();
    const { memberSince, isNewMember } = useMemberSince(address);
    const { VAULT_ADDRESS, EXPLORER } = getAddressesForChain(chainId);

    const usd = (Number(currentBalance) * USD_PER_CRNT)
        .toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    // Eagle price: live from Vault if deployed, else legacy reference figure.
    const priceRead = useReadContract({
        address: VAULT_ADDRESS || undefined,
        abi: VAULT_ABI,
        functionName: 'eaglePriceCRNT',
        query: { enabled: !!VAULT_ADDRESS },
    });
    const eaglePrice = priceRead.data !== undefined
        ? Number(priceRead.data)
        : LEGACY_VAULT_REFERENCE.eaglePriceCRNT;

    const usgoldUnits = Number(toDisplayAmount(usgoldCount));
    const usgoldValueCRNT = usgoldUnits * eaglePrice;

    const onTarget = chainId === TARGET_CHAIN.id;
    const networkName = onTarget ? TARGET_CHAIN.name : `Unrecognized (chain ${chainId})`;

    const memberSinceStr = memberSince
        ? memberSince.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : '—';

    const balanceUSD = (Number(currentBalance) * USD_PER_CRNT)
        .toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className="cur-page">

            {/* ====================================================================
              * FRIENDLY SUMMARY — plain-English, leads the page.
              * ==================================================================*/}
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <h2 style={{ marginTop: 0 }}>Your Balance</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', margin: '8px 0 4px' }}>
                    <span style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--cur-gold)' }}>
                        {balanceUSD}
                    </span>
                    <span style={{ color: 'var(--cur-muted)', fontSize: '1.05rem' }}>
                        ({toDisplayAmount(currentBalance)} CRNT)
                    </span>
                </div>
                <p style={{ color: 'var(--cur-muted)', marginBottom: usgoldUnits > 0 ? 16 : 0 }}>
                    Every CRNT in your account is worth exactly <strong style={{ color: 'var(--cur-white)' }}>$1</strong>.
                    There are no hidden fees or fluctuating exchange rates &mdash; what you see
                    is what it's worth, today and any day.
                </p>

                {usgoldUnits > 0 && (
                    <div style={{
                        background: 'var(--cur-panel-2)', border: '1px solid var(--cur-line)',
                        borderRadius: 'var(--cur-radius-sm)', padding: '14px 16px', marginTop: 6,
                    }}>
                        <p style={{ margin: 0, color: 'var(--cur-white)' }}>
                            You also hold <strong style={{ color: 'var(--cur-gold)' }}>{usgoldUnits} USGold certificate{usgoldUnits === 1 ? '' : 's'}</strong> &mdash;{' '}
                            each one represents a real, physical 1&nbsp;oz American Gold
                            Eagle coin, held safely in a vault on your behalf.
                        </p>
                        <p style={{ margin: '8px 0 0', color: 'var(--cur-muted)' }}>
                            Right now those certificates are worth about{' '}
                            <strong style={{ color: 'var(--cur-white)' }}>
                                {(usgoldValueCRNT * USD_PER_CRNT).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                            </strong> based on the current gold price.
                        </p>
                    </div>
                )}

                <p style={{ color: 'var(--cur-muted)', fontSize: '.85rem', marginTop: 16, marginBottom: 0 }}>
                    Want to turn dollars into gold certificates, or gold certificates back into
                    dollars? Head to <strong style={{ color: 'var(--cur-gold)' }}>Vault</strong>.
                    Ready to redeem a certificate for the physical coin? Go to{' '}
                    <strong style={{ color: 'var(--cur-gold)' }}>Redeem</strong>.
                </p>
            </div>

            {/* ====================================================================
              * "How this works" — plain-English explainer for non-crypto folks.
              * ==================================================================*/}
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>How this works</h2>
                <p style={{ color: 'var(--cur-muted)', marginBottom: 8 }}>
                    <strong style={{ color: 'var(--cur-white)' }}>CRNT</strong> is a digital
                    dollar. One CRNT always equals one US dollar &mdash; think of it like a
                    digital version of cash that you can hold, send, and use.
                </p>
                <p style={{ color: 'var(--cur-muted)', margin: 0 }}>
                    <strong style={{ color: 'var(--cur-white)' }}>USGold</strong> is a
                    certificate for real gold. Each USGold certificate represents one whole
                    1&nbsp;oz American Gold Eagle coin, stored securely on your behalf.
                </p>
            </div>

            {/* ====================================================================
              * Profile detail — kept for users who want the technical view.
              * ==================================================================*/}
            <div className="cur-card" style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ margin: 0 }}>{walletShortName(address)}'s Account</h2>
                <button className="cur-btn" onClick={refresh} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="cur-card" style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Profile</h2>
                <div className="cur-grid">
                    <div className="cur-stat">
                        <div className="label">Wallet</div>
                        <div className="value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>
                            {walletDisplayAddress(address)}
                        </div>
                    </div>
                    <div className="cur-stat">
                        <div className="label">Member Since</div>
                        <div className="value" style={{ fontSize: '1.05rem' }}>{memberSinceStr}</div>
                        {isNewMember && (
                            <div style={{ color: 'var(--cur-gold)', fontSize: '.8rem', marginTop: 4 }}>
                                Welcome — this is your first login!
                            </div>
                        )}
                    </div>
                    <div className="cur-stat">
                        <div className="label">Network</div>
                        <div className="value" style={{ fontSize: '1.05rem' }}>
                            {onTarget ? `${networkName} (${chainId})` : networkName}
                        </div>
                    </div>
                    <div className="cur-stat">
                        <div className="label">Access Level</div>
                        <div className="value">Verified Holder</div>
                    </div>
                </div>
                {address && (
                    <p style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 14, marginBottom: 0, wordBreak: 'break-all' }}>
                        Full address: {address}
                        {EXPLORER && (
                            <>
                                {' '}&middot;{' '}
                                <a href={`${EXPLORER}/address/${address}`} target="_blank" rel="noreferrer"
                                   style={{ color: 'var(--cur-gold)' }}>
                                    View on explorer
                                </a>
                            </>
                        )}
                    </p>
                )}
            </div>

            {/* ---- Holdings (detailed) ---- */}
            <div className="cur-grid">
                <div className="cur-stat">
                    <div className="label">Current (CRNT) Held</div>
                    <div className="value gold">{toDisplayAmount(currentBalance)}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Value in USD (1 CRNT = $1)</div>
                    <div className="value">{usd}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">USGold Certificates</div>
                    <div className="value gold">{toDisplayAmount(usgoldCount)}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">USGold Value (at {eaglePrice.toLocaleString()} CRNT each)</div>
                    <div className="value gold">{usgoldValueCRNT.toLocaleString()} CRNT</div>
                </div>
            </div>

            <div className="cur-card" style={{ marginTop: 22 }}>
                <h2 style={{ fontSize: '1.1rem' }}>About your holdings</h2>
                <p style={{ color: 'var(--cur-muted)', marginBottom: 8 }}>
                    Current&trade; is a true dollar instrument: each CRNT is an atomic,
                    indivisible unit valued at <strong style={{ color: 'var(--cur-gold)' }}>$1.00 USD</strong>.
                </p>
                <p style={{ color: 'var(--cur-muted)', margin: 0 }}>
                    Each USGold&trade; certificate represents one 1&nbsp;oz American Gold Eagle held
                    in custody. Use the <strong style={{ color: 'var(--cur-gold)' }}>Vault</strong> to
                    swap between Current and USGold, and <strong style={{ color: 'var(--cur-gold)' }}>Redeem</strong>{' '}
                    to request physical coin delivery.
                </p>
            </div>
        </div>
    );
}
