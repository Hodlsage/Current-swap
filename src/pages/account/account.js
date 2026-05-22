/* ============================================================================
 * FILE: src/pages/account/account.js
 * PAGE: Account — the user's Current holdings (in USD, 1:1) and USGold count.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.3.0  2026-05-22  Cleanup pass 2 — created (replaces old static Info page).
 *     - Shows Current balance, its USD value (Current is pegged 1 CRNT = $1),
 *       and how many USGold certificates the wallet holds.
 * ==========================================================================*/

import React from 'react';
import useWeb3 from "../../components/useWeb3";
import useBalances from "../../components/useBalances";
import { USD_PER_CRNT } from "../../config/network";
import { toDisplayAmount } from "../../utils/tokenMath";

export const Account = () => {
    const { walletAddress } = useWeb3();
    const { currentBalance, usgoldCount, loading, refresh } = useBalances();
    const connected = !!walletAddress;

    const usd = (Number(currentBalance) * USD_PER_CRNT)
        .toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    if (!connected) {
        return (
            <div className="cur-page">
                <div className="cur-card" style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
                    <h2>Account</h2>
                    <p style={{ color: "var(--cur-muted)" }}>Connect your wallet to view your account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cur-page">
            <div className="cur-card" style={{ marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>Your Account</h2>
                <button className="cur-btn" onClick={refresh} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

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
            </div>

            <div className="cur-card" style={{ marginTop: 22 }}>
                <h2 style={{ fontSize: "1.1rem" }}>About your holdings</h2>
                <p style={{ color: "var(--cur-muted)", marginBottom: 8 }}>
                    Current&trade; is a true dollar instrument: each CRNT is an atomic,
                    indivisible unit valued at <strong style={{ color: "var(--cur-gold)" }}>$1.00 USD</strong>.
                </p>
                <p style={{ color: "var(--cur-muted)", margin: 0 }}>
                    Each USGold&trade; certificate represents one 1&nbsp;oz American Gold Eagle
                    held in custody. Use the <strong style={{ color: "var(--cur-gold)" }}>Vault</strong>{" "}
                    to swap between Current and USGold, and <strong style={{ color: "var(--cur-gold)" }}>Redeem</strong>{" "}
                    to request physical coin delivery.
                </p>
            </div>
        </div>
    );
};
