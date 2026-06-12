/* ============================================================================
 * FILE: src/config/wagmi.js
 * PURPOSE: wagmi v2 + RainbowKit config. Single source of truth for the
 *          ACTIVE network + contract addresses. SINGLE-CHAIN by design: no
 *          network switcher is shown in the UI.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — created during the wagmi/RainbowKit
 *           migration. Replaces the dead web3modal/WalletConnect-v1 stack.
 *   v2.0.0  2026-06-11  Migrated from BNB testnet (97) to Polygon. Added a
 *           local Hardhat sandbox chain (31337) for offline dev/testing.
 *   v3.0.0  2026-06-12  SINGLE-CHAIN CONFIG. Removed the network switcher:
 *           wagmiConfig now exposes exactly ONE chain, controlled by the
 *           ACTIVE_NETWORK flag below ('amoy' | 'polygon'). RainbowKit's
 *           ConnectButton no longer shows "Wrong network" / a chain dropdown
 *           because there is nothing to switch to — the wallet is prompted to
 *           switch to (or add) the single configured chain on connect.
 * ----------------------------------------------------------------------------
 * HOW TO SWITCH BETWEEN TESTNET AND MAINNET
 *   Change ACTIVE_NETWORK below to 'amoy' (Polygon Amoy testnet, 80002) or
 *   'polygon' (Polygon mainnet, 137), then fill in CRNT_ADDRESS for that
 *   network in ADDRESSES. Redeploy the frontend. That's the only change
 *   needed — everything else (chain config, explorer links, RPC) follows
 *   automatically.
 * ----------------------------------------------------------------------------
 * NOTES
 *   - hardhatLocal (31337) remains available for local sandbox testing
 *     (`npx hardhat node` + deploy script) but is NOT part of wagmiConfig
 *     unless ACTIVE_NETWORK === 'local'. Point MetaMask at
 *     http://127.0.0.1:8545, chainId 31337, and import a printed test key.
 *   - WalletConnect requires a free projectId from https://cloud.walletconnect.com.
 *     MetaMask / injected wallets work WITHOUT one. We read it from an env var so
 *     you can test with MetaMask today and enable WalletConnect later by setting
 *     VITE_WALLETCONNECT_PROJECT_ID in a .env file (no code change needed).
 * ==========================================================================*/

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygonAmoy, polygon } from 'wagmi/chains';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// ---------------------------------------------------------------------------
// ACTIVE NETWORK — the ONE switch that controls everything below.
//   'amoy'    -> Polygon Amoy testnet (80002)
//   'polygon' -> Polygon mainnet (137)
//   'local'   -> local Hardhat sandbox (31337), dev-only
// ---------------------------------------------------------------------------
export const ACTIVE_NETWORK = 'polygon';

// A WalletConnect projectId is required by RainbowKit's default config, but only
// actually used for the WalletConnect option. "demo" lets MetaMask/injected work
// for local testing; set a real one via env for production WalletConnect support.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo';

/* ---- Local Hardhat sandbox chain (chainId 31337), dev-only --------------- */
export const hardhatLocal = defineChain({
    id: 31337,
    name: 'Hardhat Local',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
    },
    testnet: true,
});

const CHAIN_BY_NETWORK = {
    amoy: polygonAmoy,
    polygon: polygon,
    local: hardhatLocal,
};

const TRANSPORT_BY_NETWORK = {
    amoy: http('https://rpc-amoy.polygon.technology'),
    polygon: http('https://polygon-rpc.com'),
    local: http('http://127.0.0.1:8545'),
};

// The single active chain. wagmiConfig below is built from ONLY this chain.
export const TARGET_CHAIN = CHAIN_BY_NETWORK[ACTIVE_NETWORK];
export const TARGET_CHAIN_ID = TARGET_CHAIN.id;

export const wagmiConfig = getDefaultConfig({
    appName: 'Current Network',
    projectId,
    chains: [TARGET_CHAIN],
    transports: {
        [TARGET_CHAIN_ID]: TRANSPORT_BY_NETWORK[ACTIVE_NETWORK],
    },
    ssr: false,
});

/* ---- Contract addresses, per network -------------------------------------
 * Fill these in after deploying via Remix. Only the entry matching
 * ACTIVE_NETWORK is used at runtime (see getAddressesForChain below), but all
 * are kept here so switching ACTIVE_NETWORK doesn't lose the other network's
 * addresses.
 * ------------------------------------------------------------------------*/
export const ADDRESSES = {
    // Polygon Amoy testnet (80002)
    [polygonAmoy.id]: {
        CRNT_ADDRESS: '0xf0be42E76cF1Eb63fD65b76516cCecE09760d90e',     // TODO: paste the deployed Current.sol address (Amoy)
        USGOLD_ADDRESS: '',   // not deployed in this round
        VAULT_ADDRESS: '',
        EXPLORER: 'https://amoy.polygonscan.com',
    },
    // Polygon mainnet (137)
    [polygon.id]: {
        CRNT_ADDRESS: '',     // TODO: paste the deployed Current.sol address (mainnet)
        USGOLD_ADDRESS: '',   // not deployed in this round
        VAULT_ADDRESS: '',
        EXPLORER: 'https://polygonscan.com',
    },
    // Local Hardhat sandbox (31337), dev-only
    [hardhatLocal.id]: {
        CRNT_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        USGOLD_ADDRESS: '',   // not deployed in this round
        VAULT_ADDRESS: '',
        EXPLORER: '',
    },
};

export function getAddressesForChain(chainId) {
    return ADDRESSES[chainId] || ADDRESSES[TARGET_CHAIN_ID];
}

// Convenience exports for the active chain. Components that need the
// *connected* chain's addresses should call getAddressesForChain with
// useChainId() instead (kept in sync since there's only one chain anyway).
export const CRNT_ADDRESS = ADDRESSES[TARGET_CHAIN_ID].CRNT_ADDRESS;
export const USGOLD_ADDRESS = ADDRESSES[TARGET_CHAIN_ID].USGOLD_ADDRESS;
export const VAULT_ADDRESS = ADDRESSES[TARGET_CHAIN_ID].VAULT_ADDRESS;
export const USD_PER_CRNT = 1;     // Current is pegged 1:1 USD by definition
export const EXPLORER = ADDRESSES[TARGET_CHAIN_ID].EXPLORER;
