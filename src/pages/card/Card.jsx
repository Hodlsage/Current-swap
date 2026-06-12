/* ============================================================================
 * FILE: src/pages/card/Card.jsx
 * PAGE: Card — "Current Gold Card" (coming soon) + a demo of loading CRNT
 *       onto the card via preset amounts.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-06-12  Initial version.
 *     - "Coming soon" framing: this is a preview of a planned feature, not a
 *       live product. No real transactions occur here.
 *     - Demo: a static set of preset "load" amounts ($100 / $500 / $1,000).
 *       Selecting one shows the user's CRNT balance decreasing by that
 *       amount and a mock Visa-style card balance increasing by the same
 *       amount. Purely illustrative \u2014 no balances are actually changed
 *       on-chain; useBalances() is read-only and unaffected.
 * ==========================================================================*/

import React, { useState } from 'react';
import { useBalances } from '../../components/useBalances';
import { toDisplayAmount } from '../../utils/tokenMath';

const PRESETS = [100, 500, 1000];

export function Card() {
    const { currentBalance } = useBalances();
    const [loadAmount, setLoadAmount] = useState(0);

    const walletBalance = Number(toDisplayAmount(currentBalance));
    const previewWalletBalance = Math.max(walletBalance - loadAmount, 0);
    const previewCardBalance = loadAmount;

    const fmt = (n) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className="cur-page">

            {/* ---- Coming soon banner ---- */}
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <span className="cur-badge-ok" style={{ background: 'rgba(245,197,24,0.12)', color: 'var(--cur-gold)', borderColor: 'rgba(245,197,24,0.4)' }}>
                    Coming soon
                </span>
                <h2 style={{ marginTop: 16 }}>The Current Gold Card</h2>
                <p style={{ color: 'var(--cur-muted)', marginBottom: 0 }}>
                    Spend your CRNT anywhere Visa is accepted. Load dollars from your
                    Current balance onto a physical or virtual card in seconds &mdash; no
                    bank transfer, no waiting. We're putting the finishing touches on
                    this feature. In the meantime, try the preview below to see how
                    loading your card will work.
                </p>
            </div>

            {/* ---- Card visual ---- */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                <div style={{
                    width: '100%', maxWidth: 380, aspectRatio: '1.586 / 1',
                    borderRadius: 18,
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 55%, #2a2208 100%)',
                    border: '1px solid var(--cur-line)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    padding: '22px 26px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* subtle gold sheen */}
                    <div style={{
                        position: 'absolute', top: -60, right: -60, width: 200, height: 200,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245,197,24,0.18), transparent 70%)',
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--cur-gold)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '.03em' }}>
                                CURRENT <span style={{ color: 'var(--cur-white)' }}>GOLD CARD</span>
                            </div>
                            <div style={{ color: 'var(--cur-muted)', fontSize: '.75rem', marginTop: 2 }}>
                                Backed by CRNT
                            </div>
                        </div>
                        <div style={{ color: 'var(--cur-white)', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '.06em' }}>
                            VISA
                        </div>
                    </div>

                    <div>
                        <div style={{ color: 'var(--cur-muted)', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
                            Card balance (preview)
                        </div>
                        <div style={{ color: 'var(--cur-white)', fontWeight: 800, fontSize: '2.1rem' }}>
                            {fmt(previewCardBalance)}
                        </div>
                        <div style={{ color: 'var(--cur-muted)', fontSize: '.85rem', marginTop: 8, letterSpacing: '.12em' }}>
                            •••• •••• •••• 4242
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- Demo slider ---- */}
            <div className="cur-card" style={{ maxWidth: 560, margin: '0 auto 22px' }}>
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Try it: load your card</h2>
                <p style={{ color: 'var(--cur-muted)', marginTop: 0, marginBottom: 18 }}>
                    Pick an amount to see how moving CRNT from your balance onto your
                    Current Gold Card will work. This is a preview only &mdash; nothing is
                    actually moved.
                </p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
                    {PRESETS.map((amt) => (
                        <button
                            key={amt}
                            type="button"
                            className={`cur-btn ${loadAmount === amt ? 'cur-btn--solid' : ''}`}
                            onClick={() => setLoadAmount(amt === loadAmount ? 0 : amt)}
                            style={{ flex: 1, justifyContent: 'center', minWidth: 100 }}
                        >
                            {fmt(amt)}
                        </button>
                    ))}
                </div>

                <div className="cur-grid">
                    <div className="cur-stat">
                        <div className="label">Your CRNT balance</div>
                        <div className="value gold">{fmt(previewWalletBalance)}</div>
                        {loadAmount > 0 && (
                            <div style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 4 }}>
                                was {fmt(walletBalance)}
                            </div>
                        )}
                    </div>
                    <div className="cur-stat">
                        <div className="label">Current Gold Card balance</div>
                        <div className="value gold">{fmt(previewCardBalance)}</div>
                        {loadAmount > 0 && (
                            <div style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 4 }}>
                                ready to spend
                            </div>
                        )}
                    </div>
                </div>

                {loadAmount > walletBalance && (
                    <p style={{ color: '#ff6b6b', fontSize: '.85rem', marginTop: 14, marginBottom: 0 }}>
                        Heads up: this amount is more than your current CRNT balance. In the
                        real product, you'd only be able to load what you have available.
                    </p>
                )}
            </div>

            <div className="cur-card">
                <h2 style={{ fontSize: '1.1rem' }}>What to expect</h2>
                <p style={{ color: 'var(--cur-muted)', marginBottom: 8 }}>
                    The Current Gold Card will let you spend straight from your CRNT
                    balance &mdash; at the grocery store, online, anywhere Visa is accepted
                    &mdash; with no conversion step and no fluctuating exchange rate, because
                    1 CRNT is always $1.
                </p>
                <p style={{ color: 'var(--cur-muted)', margin: 0 }}>
                    We'll let you know as soon as it's ready to order. In the meantime,
                    your CRNT keeps its value and stays available in your{' '}
                    <strong style={{ color: 'var(--cur-gold)' }}>Account</strong>.
                </p>
            </div>
        </div>
    );
}
