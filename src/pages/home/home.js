/* ============================================================================
 * FILE: src/pages/home/home.js
 * PAGE: Home / Dashboard — wallet login confirmation + session data.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.3.0  2026-05-22  Cleanup pass 2 (scope change)
 *     - Repurposed from the old mint/exchange page into a LOGIN DASHBOARD.
 *       Shows: connection confirmation, wallet info, login date/time, network,
 *       and official-looking session "fluff" data, then a thank-you blurb
 *       directing the user to the menu (Redeem / Account / Vault).
 *     - Connect-optional: if not connected, prompts the user to connect.
 *     - Removed all minting logic (moved to the Vault swap model).
 *   v0.2.0  Atomic math cleanup (superseded by this scope change).
 *   v0.1.0  Original mint/exchange page.
 * ==========================================================================*/

import React from 'react';
import useWeb3 from "../../components/useWeb3";
import useBalances from "../../components/useBalances";
import { NETWORK, USD_PER_CRNT } from "../../config/network";
import { toDisplayAmount } from "../../utils/tokenMath";

function shortAddr(a = "") {
    return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
}

export const Home = () => {
    const { walletAddress, loginTime, chainId } = useWeb3();
    const { currentBalance, usgoldCount } = useBalances();
    const connected = !!walletAddress;

    const sessionId = walletAddress ? walletAddress.slice(2, 10).toUpperCase() : "—";
    const loginStr = loginTime
        ? loginTime.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
        : "—";
    const usdValue = connected
        ? (Number(currentBalance) * USD_PER_CRNT).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
        : "$0";

    if (!connected) {
        return (
            <div className="cur-page">
                <div className="cur-card" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
                    <h2>Welcome to Current Network</h2>
                    <p style={{ color: "var(--cur-muted)" }}>
                        Connect your Web3 wallet using the button in the menu above to verify
                        your access to the Current&trade; Dollar instrument and your USGold&trade;
                        certificates.
                    </p>
                    <p style={{ color: "var(--cur-gold)" }}>
                        Your wallet is your secure login. No password required.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="cur-page">
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <span className="cur-badge-ok">✅ Access verified</span>
                <h2 style={{ marginTop: 16 }}>Hello, user {shortAddr(walletAddress)}</h2>
                <p style={{ color: "var(--cur-muted)", marginBottom: 0 }}>
                    Thank you for verifying your access. Please choose an area from the menu
                    above &mdash; <strong style={{ color: "var(--cur-gold)" }}>Redeem</strong>,{" "}
                    <strong style={{ color: "var(--cur-gold)" }}>Account</strong>, or{" "}
                    <strong style={{ color: "var(--cur-gold)" }}>Vault</strong>.
                </p>
            </div>

            <div className="cur-grid">
                <div className="cur-stat">
                    <div className="label">Wallet Address</div>
                    <div className="value" style={{ fontSize: "1rem", wordBreak: "break-all" }}>{walletAddress}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Session ID</div>
                    <div className="value gold">CUR-{sessionId}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Logged In</div>
                    <div className="value" style={{ fontSize: "1.05rem" }}>{loginStr}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Network</div>
                    <div className="value" style={{ fontSize: "1.05rem" }}>
                        {NETWORK.name}{chainId ? ` (${parseInt(chainId, 16)})` : ""}
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
};
