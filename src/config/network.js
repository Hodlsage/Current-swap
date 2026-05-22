/* ============================================================================
 * FILE: src/config/network.js
 * PURPOSE: Single source of truth for chain + contract addresses.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Cleanup pass 2 — created.
 *     - Centralises addresses previously hardcoded across home.js,
 *       contractsAddress.js, and lockInstance.js.
 *     - CRNT_ADDRESS taken from the repo's existing connect data (BSC testnet).
 *     - VAULT_ADDRESS is a placeholder until the Phase-1 vault is deployed; the
 *       Vault page reads this and degrades gracefully if it is unset.
 * ==========================================================================*/

export const NETWORK = {
    name: "BSC Testnet",
    chainIdHex: "0x61",   // 97
    chainId: 97,
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    explorer: "https://testnet.bscscan.com",
};

export const CRNT_ADDRESS = "0x7Ce8E3780F6C688C11039917f40563ECFDCCd0d8";
export const USGOLD_ADDRESS = "0x1EDA76120d64d45F693AD6730c54d5E08852a734";
export const VAULT_ADDRESS = "";   // set after deploying USGoldVault.sol
export const USD_PER_CRNT = 1;     // Current is pegged 1:1 to USD by definition
