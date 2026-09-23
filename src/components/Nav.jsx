/* ============================================================================
 * FILE: src/components/Nav.jsx
 * PURPOSE: Top navigation. Menu (Redeem/Account/Vault/Card) + WalletButton
 *          (custom connect/account control, replacing RainbowKit's default
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
 *   v1.4.0  2026-09-23  Relinked "Card" tab. The v1.2.0 revert blamed the
 *           4th tab itself, but v1.3.0 shows the real cause was RainbowKit's
 *           default ConnectButton, already fixed independently. Card
 *           page/route were never removed, only unlinked -- safe to restore.
 *   v1.5.0  2026-09-23  Real mobile nav added -- previously this was a plain
 *           always-visible horizontal row with zero responsive behavior
 *           (theme.css had no @media rules at all), so on a phone it either
 *           overflowed or crushed together. Added a hamburger toggle that
 *           only appears below the mobile breakpoint (see theme.css); the
 *           links render in a slide-down panel when open, and auto-close on
 *           navigation so the menu doesn't stay open after picking a page.
 *   v1.6.0  2026-09-23  Added "Profile" tab -> /profile (nickname/KYC
 *           status/preferences, backed by Supabase + a SIWE session).
 * ==========================================================================*/

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from './WalletButton';

export function Nav() {
    const { pathname } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    // Auto-close the mobile menu whenever the route changes (picking a link
    // should close it, not leave it hanging open over the new page).
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const tab = (to, label) => (
        <Link
            to={to}
            className={`cur-navlink ${pathname === to ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
        >
            {label}
        </Link>
    );

    return (
        <header className="cur-nav">
            <div className="cur-nav__inner">
                <Link to="/" className="cur-brand">
                    CURRENT<span>NETWORK</span>
                </Link>

                <nav className={`cur-nav__links ${menuOpen ? 'is-open' : ''}`}>
                    {tab('/redeem', 'Redeem')}
                    {tab('/account', 'Account')}
                    {tab('/vault', 'Vault')}
                    {tab('/card', 'Card')}
                    {tab('/profile', 'Profile')}
                </nav>

                <div className="cur-nav__actions">
                    <WalletButton />
                    <button
                        type="button"
                        className={`cur-nav__burger ${menuOpen ? 'is-open' : ''}`}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </div>
        </header>
    );
}
