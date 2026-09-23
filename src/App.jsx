/* ============================================================================
 * FILE: src/App.jsx
 * PURPOSE: Routes + the wallet auth-gate. Every page requires a connected
 *          wallet; unconnected access shows the connect prompt (RainbowKit).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3
 *     - The whole app sits behind a wallet gate. Per requirement: the user
 *       arrives here after hitting "connect" on the marketing site, lands on
 *       Home, and attempting ANY page without a connected wallet forces the
 *       RainbowKit connect modal (no wallet => no pages).
 *   v1.1.0  2026-06-12  Added /card route (Current Gold Card, coming soon).
 *   v1.2.0  2026-09-23  Added /profile route -- nickname/KYC status/
 *           preferences, backed by Supabase + a SIWE session. Note this
 *           page has an ADDITIONAL gate beyond RequireWallet: RequireWallet
 *           only checks wagmi's isConnected (a wallet is present), but
 *           Profile itself further requires a verified signature session
 *           (see useSiweAuth.js) before showing any data -- connected alone
 *           isn't enough to read/write off-chain profile data.
 * ==========================================================================*/

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { ConnectGate } from './components/ConnectGate';
import { Home } from './pages/home/Home';
import { Redeem } from './pages/redeem/Redeem';
import { Account } from './pages/account/Account';
import { Vault } from './pages/vault/Vault';
import { Card } from './pages/card/Card';
import { Profile } from './pages/profile/Profile';

/**
 * RequireWallet: renders children only when a wallet is connected. Otherwise it
 * renders the ConnectGate, which forces the user to connect before proceeding.
 */
function RequireWallet({ children }) {
    const { isConnected } = useAccount();
    return isConnected ? children : <ConnectGate />;
}

export default function App() {
    return (
        <div className="currentswap-main">
            <Nav />
            <div className="page-area">
                <Routes>
                    <Route path="/" element={<RequireWallet><Home /></RequireWallet>} />
                    <Route path="/redeem" element={<RequireWallet><Redeem /></RequireWallet>} />
                    <Route path="/account" element={<RequireWallet><Account /></RequireWallet>} />
                    <Route path="/vault" element={<RequireWallet><Vault /></RequireWallet>} />
                    <Route path="/card" element={<RequireWallet><Card /></RequireWallet>} />
                    <Route path="/profile" element={<RequireWallet><Profile /></RequireWallet>} />
                </Routes>
            </div>
            <Footer />
        </div>
    );
}
