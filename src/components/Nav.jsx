/* ============================================================================
 * FILE: src/components/Nav.jsx
 * PURPOSE: Top navigation. Menu (Redeem/Account/Vault) + RainbowKit account
 *          control (the small wallet pill + disconnect lives inside it).
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
 * ==========================================================================*/

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

                {/* RainbowKit account control: compact avatar + address + the
                    built-in account modal that includes Disconnect.
                    chainStatus="none": wagmiConfig is single-chain (see
                    config/wagmi.js), so no network pill/switcher is shown. */}
                <ConnectButton
                    accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
                    chainStatus="none"
                    showBalance={false}
                />
            </div>
        </header>
    );
}
