/* ============================================================================
 * FILE: src/components/Nav.jsx
 * PURPOSE: Top navigation. Menu (Redeem/Account/Vault) + WalletButton (custom
 *          connect/account control, replacing RainbowKit's default
 *          ConnectButton — see WalletButton.jsx).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3
 *     - Replaced the hand-rolled web3modal nav with RainbowKit's ConnectButton.
 *       When connected it shows a compact account pill (avatar + address) with a
 *       built-in disconnect — satisfying the "small icon + disconnect" pattern.
 *     - Menu links only navigate; the wallet gate (App.jsx) handles access.
 *   v1.1.0  2026-06-12  Added "Card" tab -> /card (Current Gold Card, coming
 *           soon page with a load-CRNT-onto-card demo).
 *   v1.2.0  2026-06-12  REVERTED v1.1.0: the 4th tab broke the nav bar in
 *           Firefox (brand logo + wallet button became invisible and
 *           unresponsive; reproducible after hard refresh, Chrome unaffected).
 *           Root cause not yet isolated. Card page/route still exist
 *           (src/pages/card/Card.jsx, App.jsx route) but are unlinked from
 *           nav until the Firefox issue is debugged separately.
 *   v1.3.0  2026-06-12  Firefox issue persisted even after the v1.2.0 revert
 *           (3-tab nav also affected on live Vercel deploy) — narrowed to
 *           RainbowKit's default <ConnectButton />, whose `mounted` +
 *           connectionStatus gate can leave it permanently
 *           opacity:0/pointer-events:none in some states. Replaced with
 *           WalletButton (src/components/WalletButton.jsx), a
 *           <ConnectButton.Custom> implementation styled with .cur-btn that
 *           always renders a visible, clickable element.
 * ==========================================================================*/

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from './WalletButton';

export function Nav() {
    const { pathname } = useLocation();
    const tab = (to, label) => (
        <Link to={to} className={`cur-navlink ${pathname === to ? 'active' : ''}`}>
            {label}
        </Link>
    );

    return (
        <header className="cur-nav">
            <div className="cur-nav__inner">
                <Link to="/" className="cur-brand">
                    CURRENT<span>NETWORK</span>
                </Link>

                <nav className="cur-nav__links">
                    {tab('/redeem', 'Redeem')}
                    {tab('/account', 'Account')}
                    {tab('/vault', 'Vault')}
                </nav>

                <WalletButton />
            </div>
        </header>
    );
}
