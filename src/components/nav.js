/* ============================================================================
 * FILE: src/components/nav.js
 * COMPONENT: Nav  (top navigation bar + wallet connect/disconnect controls)
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Cleanup pass 1 (frontend bug fixes)
 *     - CRITICAL FIX: removed the bare `onConnect();` call that sat in the
 *       component body. It executed on EVERY render, opening the wallet popup
 *       in an infinite loop and was the primary "app throws errors / unusable"
 *       symptom.
 *     - CRITICAL FIX: connect button label previously rendered the `onConnect`
 *       FUNCTION as a React child (`walletAddress === "" ? onConnect : ...`),
 *       which React cannot render. Now shows a text label.
 *     - FIX: Web3Modal instance was re-created on every render. Moved into a
 *       useMemo so the cached-provider logic and event subscriptions are stable.
 *     - FIX: disconnect button used the wrong handler and an inverted guard.
 *     - FIX: connected state now shows a truncated address via ellipseAddress().
 *     - NOTE: This file still uses the EOL web3modal/walletconnect v1 stack.
 *       Connection via WalletConnect will NOT work (v1 bridge servers are gone).
 *       Full migration to wagmi+viem+RainbowKit is scheduled for cleanup pass 2.
 *       This pass only stops the render loop and the crash so the app is usable
 *       with an injected wallet (MetaMask / Binance Wallet) for testing.
 *   v0.1.0  Original as cloned.
 * ==========================================================================*/

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from "react-router-dom";

import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnect from "@walletconnect/web3-provider";
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import useWeb3 from "./useWeb3";
import './nav.css';

/* ----------------------------------------------------------------------------
 * Network configuration
 *   The app targets Binance Smart Chain TESTNET (chainId 97 / 0x61).
 *   Centralised here so there are no magic hex strings scattered in handlers.
 * --------------------------------------------------------------------------*/
const BSC_TESTNET = {
    chainIdHex: '0x61',                     // 97 decimal
    chainName: 'Smart Chain - Testnet',
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    nativeCurrency: { name: 'tBNB', symbol: 'BNB', decimals: 18 },
};

/* ----------------------------------------------------------------------------
 * getProviderOptions
 *   Wallet options offered by the Web3Modal picker. NOTE: WalletConnect here is
 *   v1 and effectively dead; kept only so the modal renders. MetaMask / injected
 *   wallets still work. (Pass 2 replaces this whole block.)
 * --------------------------------------------------------------------------*/
const getProviderOptions = () => ({
    walletconnect: {
        package: WalletConnect,
        options: {
            // testnet RPC so WC, if ever used, matches the app's target chain
            rpc: { 97: BSC_TESTNET.rpcUrls[0] },
        },
    },
    coinbasewallet: {
        package: CoinbaseWalletSDK,
        options: {
            appName: "Current Network",
            rpc: BSC_TESTNET.rpcUrls[0],
            chainId: 97,
            darkMode: false,
        },
    },
    "custom-binancechainwallet": {
        display: {
            name: "Binance Chain Wallet",
            description: "Connect to your Binance Chain Wallet",
        },
        package: true,
        connector: async () => {
            if (typeof window.BinanceChain === 'undefined') {
                throw new Error("No Binance Chain Wallet found");
            }
            const provider = window.BinanceChain;
            await provider.request({ method: 'eth_requestAccounts' });
            return provider;
        },
    },
});

/* ----------------------------------------------------------------------------
 * ellipseAddress  -> "0x1234ab...cd5678"  (module scope: pure helper)
 * --------------------------------------------------------------------------*/
function ellipseAddress(address = "", width = 6) {
    if (!address) return "";
    return `${address.slice(0, width)}...${address.slice(-width)}`;
}

export const Nav = () => {
    const location = useLocation();
    const { web3, setWeb3, walletAddress, setWalletAddress, setLoginTime, setChainId } = useWeb3();

    // Local flag so the connect button can show a pending state and we never
    // fire two concurrent connect attempts.
    const [connecting, setConnecting] = useState(false);

    /* Stable Web3Modal instance. Previously this was re-created on every render,
     * which defeated cacheProvider and re-bound listeners repeatedly. */
    const web3Modal = useMemo(
        () => new Web3Modal({
            cacheProvider: true,
            providerOptions: getProviderOptions(),
        }),
        []
    );

    /* resetApp: tear down the current session. */
    const resetApp = async () => {
        try {
            if (web3 && web3.currentProvider && web3.currentProvider.close) {
                await web3.currentProvider.close();
            }
        } catch (e) {
            console.warn("provider close failed (non-fatal):", e);
        }
        setWalletAddress("");
        setWeb3(undefined);
        setLoginTime(null);
        setChainId("");
        await web3Modal.clearCachedProvider();
    };

    /* subscribeProvider: keep React state in sync with wallet events. */
    const subscribeProvider = async (provider) => {
        if (!provider.on) return;
        provider.on("close", () => resetApp());
        provider.on("accountsChanged", (accounts) => {
            setWalletAddress(accounts && accounts.length ? accounts[0] : "");
        });
        // chainChanged: simplest correct behaviour is a soft reset so the user
        // re-confirms they are on BSC testnet. (Pass 2 handles this natively.)
        provider.on("chainChanged", () => resetApp());
    };

    /* ensureTestnet: make sure the wallet is on BSC testnet; offer to add it. */
    const ensureTestnet = async (provider) => {
        const chainId = await provider.request({ method: 'eth_chainId' });
        if (chainId === BSC_TESTNET.chainIdHex) return true;
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BSC_TESTNET.chainIdHex }],
            });
            return true;
        } catch (switchError) {
            // 4902 = chain not added to the wallet yet -> add it, then it's selected.
            if (switchError && switchError.code === 4902) {
                try {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: BSC_TESTNET.chainIdHex,
                            chainName: BSC_TESTNET.chainName,
                            rpcUrls: BSC_TESTNET.rpcUrls,
                            blockExplorerUrls: BSC_TESTNET.blockExplorerUrls,
                            nativeCurrency: BSC_TESTNET.nativeCurrency,
                        }],
                    });
                    return true;
                } catch (addError) {
                    console.error("Failed to add BSC testnet:", addError);
                    return false;
                }
            }
            console.error("Failed to switch network:", switchError);
            return false;
        }
    };

    /* onConnect: USER-INITIATED only. Never call this during render. */
    const onConnect = async () => {
        if (connecting) return;
        setConnecting(true);
        try {
            const provider = await web3Modal.connect();
            await subscribeProvider(provider);

            const onTestnet = await ensureTestnet(provider);
            if (!onTestnet) { setConnecting(false); return; }

            setWeb3(new Web3(provider));
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            setWalletAddress(accounts && accounts.length ? accounts[0] : "");

            // Session metadata for the dashboard (login confirmation + fluff).
            if (accounts && accounts.length) {
                setLoginTime(new Date());
                try {
                    const cid = await provider.request({ method: 'eth_chainId' });
                    setChainId(cid);
                } catch (e) { /* non-fatal */ }
            }
        } catch (e) {
            // User rejecting the modal lands here; log quietly, don't crash.
            console.warn("Wallet connection cancelled or failed:", e);
        } finally {
            setConnecting(false);
        }
    };

    /* Auto-reconnect on mount IF (and only if) a provider was previously cached.
     * This is the correct place for any connect side-effect: an effect that runs
     * once, not the render body. */
    useEffect(() => {
        if (web3Modal.cachedProvider) {
            onConnect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isConnected = walletAddress !== "";

    return (
        <header className="nav-header">
            <nav className="navbar navbar-dark navbar-expand-md py-3 nav-background">
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center" to="/">
                        <img src="../img/currentforbg-sm.png" alt="Current" width="120" />
                    </Link>
                    <button
                        data-bs-toggle="collapse"
                        className="navbar-toggler nav-button"
                        data-bs-target="#navcol-1"
                        type="button"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" style={{ color: "var(--bs-yellow)" }} />
                    </button>

                    <div className="collapse navbar-collapse" id="navcol-1">
                        <ul className="navbar-nav me-auto" />
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link to="/redeem" className={`nav-link nav-tab ${location.pathname === "/redeem" ? "active" : ""}`}>
                                    Redeem
                                </Link>
                            </li>
                        </ul>
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link to="/account" className={`nav-link nav-tab ${location.pathname === "/account" ? "active" : ""}`}>
                                    Account
                                </Link>
                            </li>
                        </ul>
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link to="/vault" className={`nav-link nav-tab ${location.pathname === "/vault" ? "active" : ""}`}>
                                    Vault
                                </Link>
                            </li>
                        </ul>
                        <br />

                        {/* Wallet area:
                            - Not connected: a single "Connect Wallet" button.
                            - Connected: a small round wallet icon + truncated address,
                              followed by a Disconnect button (per requirement #3, the
                              old Connect/Connected/Disconnect trio is gone). */}
                        {!isConnected ? (
                            <button
                                className="cur-btn cur-btn--solid"
                                type="button"
                                disabled={connecting}
                                onClick={onConnect}
                            >
                                {connecting ? "Connecting..." : "Connect Wallet"}
                            </button>
                        ) : (
                            <div className="cur-wallet">
                                <span
                                    className="cur-wallet__icon"
                                    title={walletAddress}
                                    aria-label="Connected wallet"
                                >
                                    {walletAddress.slice(2, 4).toUpperCase()}
                                </span>
                                <span className="cur-wallet__addr">{ellipseAddress(walletAddress)}</span>
                                <button className="cur-btn" type="button" onClick={resetApp}>
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};
