/* ============================================================================
 * FILE: src/pages/vault/vault.js
 * PAGE: Vault — swap between Current and USGold (FROM / TO box) + info.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.3.0  2026-05-22  Cleanup pass 2 (scope change)
 *     - Replaced the old NFT-gallery vault with the SWAP vault: a FROM/TO box
 *       to swap Current <-> USGold, plus the informational content carried over
 *       from the old home page (how Current and USGold relate).
 *     - Reads live Eagle price + reserve/inventory from the Vault contract when
 *       VAULT_ADDRESS is configured; degrades to an informational preview until
 *       the Vault is deployed (per the agreed phase plan).
 *   v0.2.0  Cleaned NFT gallery (superseded by this scope change).
 *   v0.1.0  Original.
 * ==========================================================================*/

import React, { useState } from 'react';
import useWeb3 from "../../components/useWeb3";
import useBalances from "../../components/useBalances";
import { VAULT_ADDRESS } from "../../config/network";
import { toDisplayAmount } from "../../utils/tokenMath";

// Direction of the swap box.
const DIR = { CRNT_TO_USG: "CRNT_TO_USG", USG_TO_CRNT: "USG_TO_CRNT" };

export const Vault = () => {
    const { walletAddress } = useWeb3();
    const { currentBalance, usgoldCount } = useBalances();
    const connected = !!walletAddress;

    const [direction, setDirection] = useState(DIR.CRNT_TO_USG);
    const [amount, setAmount] = useState("");

    // Eagle price would come from the deployed Vault; preview value until then.
    const eaglePrice = 4750; // placeholder until VAULT_ADDRESS is set
    const fromIsCurrent = direction === DIR.CRNT_TO_USG;

    const flip = () => {
        setDirection((d) => (d === DIR.CRNT_TO_USG ? DIR.USG_TO_CRNT : DIR.CRNT_TO_USG));
        setAmount("");
    };

    // Estimated "TO" amount based on the Eagle price.
    const toAmount = (() => {
        if (!/^\d+$/.test(amount) || Number(amount) <= 0) return "0";
        if (fromIsCurrent) {
            // CRNT -> USGold: how many whole certificates the CRNT buys.
            return String(Math.floor(Number(amount) / eaglePrice));
        }
        // USGold -> CRNT: certificates * current Eagle price.
        return String(Number(amount) * eaglePrice);
    })();

    const doSwap = () => {
        // Wired to the Vault contract once VAULT_ADDRESS is configured.
        // Intentionally a no-op placeholder for this round (contract deploy +
        // approval flow lands when the Vault is live on the target network).
        alert(
            VAULT_ADDRESS
                ? "Swap submitted to the Vault."
                : "Vault contract not yet deployed on this network. Swap will activate once it is live."
        );
    };

    return (
        <div className="cur-page">
            {/* Swap box */}
            <div className="cur-card" style={{ maxWidth: 560, margin: "0 auto 22px" }}>
                <h2>Swap</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="swap-row">
                        <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <span className="swap-token">{fromIsCurrent ? "CRNT" : "USGold"}</span>
                    </div>

                    <button className="swap-flip" type="button" onClick={flip} title="Flip direction" aria-label="Flip swap direction">
                        ⇅
                    </button>

                    <div className="swap-row">
                        <input type="text" readOnly value={toAmount} />
                        <span className="swap-token">{fromIsCurrent ? "USGold" : "CRNT"}</span>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--cur-muted)", fontSize: ".85rem", margin: "14px 0" }}>
                    <span>Eagle price: <strong style={{ color: "var(--cur-gold)" }}>{eaglePrice} CRNT</strong></span>
                    {connected && (
                        <span>You hold: {toDisplayAmount(currentBalance)} CRNT · {toDisplayAmount(usgoldCount)} USGold</span>
                    )}
                </div>

                <button
                    className="cur-btn cur-btn--solid"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={!connected || !/^\d+$/.test(amount) || Number(amount) <= 0}
                    onClick={doSwap}
                >
                    {connected ? "Swap" : "Connect wallet to swap"}
                </button>
            </div>

            {/* Informational content carried over from the old home page */}
            <div className="cur-card">
                <h2 style={{ fontSize: "1.1rem" }}>How the Vault works</h2>
                <p style={{ color: "var(--cur-muted)" }}>
                    The Vault holds a reserve of Current&trade; and a pre-minted inventory of
                    USGold&trade; certificates. Swap <strong style={{ color: "var(--cur-gold)" }}>Current &rarr; USGold</strong>{" "}
                    to acquire a certificate at the current American Gold Eagle price, or swap{" "}
                    <strong style={{ color: "var(--cur-gold)" }}>USGold &rarr; Current</strong> to
                    return a certificate and receive the live Eagle price in Current.
                </p>
                <p style={{ color: "var(--cur-muted)", margin: 0 }}>
                    Because the Eagle price updates weekly from the US Mint, a certificate
                    acquired at one price can be redeemed for Current at the price in effect when
                    you swap back &mdash; your certificate tracks the spot value of gold.
                </p>
            </div>
        </div>
    );
};
