/* ============================================================================
 * FILE: src/components/WalletButton.jsx
 * PURPOSE: Custom wallet connect/account button, replacing RainbowKit's
 *          default <ConnectButton />. Built on <ConnectButton.Custom> so we
 *          have full control over rendering and the "ready"/"mounted" gate.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-06-12  Created to replace <ConnectButton /> in Nav.jsx.
 *     - The default <ConnectButton /> renders with `opacity: 0;
 *       pointer-events: none` until RainbowKit's internal `mounted` flag AND
 *       connectionStatus both resolve. In some browser/extension states this
 *       can stay unresolved, leaving the button invisible and unclickable
 *       indefinitely (reported: Firefox, wallet button + brand logo both
 *       appear missing with no visible content and no click response).
 *     - This component still respects `mounted` (required \u2014 avoids
 *       SSR/CSR mismatches and calling wallet APIs before the provider tree
 *       is ready), but renders a clearly-visible button in every other state
 *       (connecting, wrong network, connected), styled with the existing
 *       .cur-btn / .cur-btn--solid classes so it matches the rest of the UI.
 *     - chainStatus is not surfaced (wagmiConfig is single-chain, see
 *       config/wagmi.js) \u2014 if chain.unsupported, we show a "Wrong network"
 *       state instead of a chain-switcher.
 * ==========================================================================*/

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletButton() {
    return (
        <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openConnectModal, openChainModal, mounted }) => {
                // Before mount, render an invisible placeholder of the same
                // approximate size to avoid layout shift \u2014 but keep it in
                // the DOM (not display:none) so there's never a moment where
                // the nav has zero items on the right.
                if (!mounted) {
                    return (
                        <button className="cur-btn" style={{ visibility: 'hidden' }} aria-hidden="true">
                            Connect Wallet
                        </button>
                    );
                }

                if (!account) {
                    return (
                        <button className="cur-btn cur-btn--solid" type="button" onClick={openConnectModal}>
                            Connect Wallet
                        </button>
                    );
                }

                if (chain?.unsupported) {
                    return (
                        <button className="cur-btn" type="button" onClick={openChainModal} style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}>
                            Wrong network
                        </button>
                    );
                }

                return (
                    <button className="cur-btn" type="button" onClick={openAccountModal}>
                        {account.displayName}
                    </button>
                );
            }}
        </ConnectButton.Custom>
    );
}
