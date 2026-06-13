/* ============================================================================
 * FILE: src/components/WalletButton.jsx
 * PURPOSE: Custom wallet connect/account button, replacing RainbowKit's
 *          default <ConnectButton />. Built on <ConnectButton.Custom> so we
 *          have full control over rendering and the "ready"/"mounted" gate.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-06-12  Created to replace <ConnectButton /> in Nav.jsx.
 *     - The default <ConnectButton /> renders with opacity:0 and
 *       pointer-events:none until RainbowKit's internal "mounted" flag AND
 *       connectionStatus both resolve. In some browser/extension states this
 *       can stay unresolved, leaving the button invisible and unclickable
 *       indefinitely (reported: Firefox, wallet button + brand logo both
 *       appear missing with no visible content and no click response).
 *     - This component still respects "mounted" (required, to avoid
 *       SSR/CSR mismatches and calling wallet APIs before the provider tree
 *       is ready), but renders a clearly-visible button in every other state
 *       (connecting, wrong network, connected), styled with the existing
 *       .cur-btn / .cur-btn--solid classes so it matches the rest of the UI.
 *   v1.1.0  2026-06-12  "Wrong network" was showing even while genuinely
 *           connected to Polygon mainnet. Cause: this used RainbowKit's
 *           chain.unsupported flag, which can read true transiently right
 *           after connecting even on a supported chain. Switched to the
 *           same chainId === TARGET_CHAIN.id comparison already used (and
 *           working correctly) in Home.jsx.
 * ==========================================================================*/

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TARGET_CHAIN } from '../config/wagmi';

export function WalletButton() {
    return (
        <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openConnectModal, openChainModal, mounted }) => {
                // Before mount, render an invisible placeholder of the same
                // approximate size to avoid layout shift, but keep it in the
                // DOM (not display:none) so the nav never has zero items on
                // the right.
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

                // Compare against TARGET_CHAIN.id directly rather than
                // relying on RainbowKit's chain.unsupported flag, which can
                // be stale/true transiently right after connecting even when
                // the wallet IS on the configured chain (see Home.jsx, which
                // uses the same chainId === TARGET_CHAIN.id check).
                const wrongNetwork = chain?.id !== undefined && chain.id !== TARGET_CHAIN.id;

                if (wrongNetwork) {
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
