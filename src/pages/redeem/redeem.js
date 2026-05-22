/* ============================================================================
 * FILE: src/pages/redeem/redeem.js
 * PAGE: Redeem — request physical American Gold Eagle delivery (KYC).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.3.0  2026-05-22  Cleanup pass 2 — created.
 *     - Shows how many USGold certificates the wallet holds.
 *     - KYC form: name, email, shipping address, quantity to redeem.
 *     - On submit: composes a redemption request to redeem@currentnetwork.us
 *       (via mailto, so no backend is required for this round) and explains
 *       that the USGold will be sent to the Vault on confirmation.
 *     - NOTE: the actual on-chain transfer of USGold into the Vault is wired to
 *       VAULT_ADDRESS from config; until the Vault is deployed (VAULT_ADDRESS
 *       empty) the page collects the request and emails it, and the transfer
 *       step is shown as pending. This avoids sending tokens to a zero address.
 * ==========================================================================*/

import React, { useState } from 'react';
import useWeb3 from "../../components/useWeb3";
import useBalances from "../../components/useBalances";
import { VAULT_ADDRESS } from "../../config/network";
import { toDisplayAmount } from "../../utils/tokenMath";

const REDEEM_EMAIL = "redeem@currentnetwork.us";

export const Redeem = () => {
    const { walletAddress } = useWeb3();
    const { usgoldCount } = useBalances();
    const connected = !!walletAddress;

    const [form, setForm] = useState({ name: "", email: "", address: "", quantity: "1" });
    const held = Number(toDisplayAmount(usgoldCount));

    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = () => {
        // Build the KYC redemption request email body.
        const subject = encodeURIComponent(`USGold Redemption Request — ${form.quantity} coin(s)`);
        const body = encodeURIComponent(
            `USGold Redemption Request\n` +
            `--------------------------------\n` +
            `Wallet: ${walletAddress}\n` +
            `Certificates held: ${held}\n` +
            `Quantity to redeem: ${form.quantity}\n\n` +
            `KYC Details\n` +
            `Full name: ${form.name}\n` +
            `Email: ${form.email}\n` +
            `Shipping address:\n${form.address}\n\n` +
            `On confirmation, ${form.quantity} USGold certificate(s) will be sent to the ` +
            `Current Network Vault and the corresponding American Gold Eagle coin(s) shipped.\n`
        );
        // Opens the user's mail client addressed to the redemption desk.
        window.location.href = `mailto:${REDEEM_EMAIL}?subject=${subject}&body=${body}`;
    };

    if (!connected) {
        return (
            <div className="cur-page">
                <div className="cur-card" style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
                    <h2>Redeem</h2>
                    <p style={{ color: "var(--cur-muted)" }}>Connect your wallet to redeem your certificates.</p>
                </div>
            </div>
        );
    }

    const qtyValid = /^\d+$/.test(form.quantity) && Number(form.quantity) > 0 && Number(form.quantity) <= held;
    const formValid = form.name && form.email && form.address && qtyValid;

    return (
        <div className="cur-page">
            <div className="cur-grid" style={{ marginBottom: 22 }}>
                <div className="cur-stat">
                    <div className="label">USGold Certificates Held</div>
                    <div className="value gold">{held}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Each Redeems For</div>
                    <div className="value">1 oz American Gold Eagle</div>
                </div>
            </div>

            <div className="cur-card">
                <h2>Redeem for physical coins</h2>
                <p style={{ color: "var(--cur-muted)" }}>
                    Complete the KYC details below to request delivery of your American Gold
                    Eagle coin(s). Your request is sent to our redemption desk
                    (<span style={{ color: "var(--cur-gold)" }}>{REDEEM_EMAIL}</span>) and your
                    USGold certificate(s) will be transferred into the Vault on confirmation.
                </p>

                <div style={{ display: "grid", gap: 14, maxWidth: 560 }}>
                    <label>
                        <div style={{ color: "var(--cur-muted)", fontSize: ".85rem", marginBottom: 4 }}>Full legal name</div>
                        <input className="redeem-input" value={form.name} onChange={update("name")} placeholder="Jane Doe" />
                    </label>
                    <label>
                        <div style={{ color: "var(--cur-muted)", fontSize: ".85rem", marginBottom: 4 }}>Email</div>
                        <input className="redeem-input" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
                    </label>
                    <label>
                        <div style={{ color: "var(--cur-muted)", fontSize: ".85rem", marginBottom: 4 }}>Shipping address</div>
                        <textarea className="redeem-input" rows={3} value={form.address} onChange={update("address")} placeholder="Street, City, State, ZIP, Country" />
                    </label>
                    <label>
                        <div style={{ color: "var(--cur-muted)", fontSize: ".85rem", marginBottom: 4 }}>
                            Quantity to redeem (max {held})
                        </div>
                        <input className="redeem-input" type="number" min="1" step="1" max={held} value={form.quantity} onChange={update("quantity")} />
                        {!qtyValid && form.quantity !== "" && (
                            <div style={{ color: "#ff6b6b", fontSize: ".8rem", marginTop: 4 }}>
                                Enter a whole number between 1 and {held}.
                            </div>
                        )}
                    </label>

                    <button className="cur-btn cur-btn--solid" disabled={!formValid} onClick={submit}>
                        Submit Redemption Request
                    </button>

                    {!VAULT_ADDRESS && (
                        <p style={{ color: "var(--cur-muted)", fontSize: ".8rem", margin: 0 }}>
                            Note: on-chain transfer to the Vault activates once the Vault contract
                            is deployed. Your request will still be emailed to the redemption desk.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
