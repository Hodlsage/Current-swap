/* ============================================================================
 * FILE: src/components/ConnectGate.jsx
 * PURPOSE: Forced-connect screen. Shown in place of any page when no wallet is
 *          connected. Uses RainbowKit's ConnectButton.Custom for a themed CTA.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — created.
 *   v1.1.0  2026-06-12  Fixed stale "BNB Smart Chain Testnet" footer text
 *           (leftover from before the Polygon migration). Now reads the
 *           network name from config/wagmi.js's TARGET_CHAIN, so it always
 *           matches the single configured chain.
 * ==========================================================================*/

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TARGET_CHAIN } from '../config/wagmi';

export function ConnectGate() {
    return (
        <div className="cur-page">
            <div className="cur-card" style={{ textAlign: 'center', maxWidth: 520, margin: '60px auto 0' }}>
                <div className="cur-wallet__icon" style={{ width: 56, height: 56, margin: '0 auto 18px', fontSize: '1.1rem' }}>
                    🔒
                </div>
                <h2>Connect your wallet to continue</h2>
                <p style={{ color: 'var(--cur-muted)' }}>
                    Access to Current Network requires a connected Web3 wallet. Your wallet is
                    your secure login &mdash; no password required.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                    <ConnectButton label="Connect Wallet" />
                </div>
                <p style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 18, marginBottom: 0 }}>
                    Network: {TARGET_CHAIN.name}. MetaMask will prompt you to switch if needed.
                </p>
            </div>
        </div>
    );
}
