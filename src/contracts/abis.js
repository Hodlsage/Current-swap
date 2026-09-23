/* ============================================================================
 * FILE: src/contracts/abis.js
 * PURPOSE: Minimal ABIs (only the functions the UI calls) for viem/wagmi.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — created. viem prefers compact, typed
 *           ABIs; we only include what the dashboard/account/redeem/vault read.
 *   v1.1.0  2026-06-11  CRNT_ABI extended for the new Current.sol: name,
 *           totalSupply, paused, isFrozen (status reads used by Home/Account).
 *   v1.2.0  2026-09-23  CRNT_ABI extended with owner, pendingOwner, isMinter,
 *           isPauser -- these exist on Current.sol but were never added to
 *           the ABI, so nothing in the UI could read them. Added for the
 *           new Token Info panel (components/TokenInfo.jsx).
 *   v1.3.0  2026-09-23  Renamed USGOLD_ABI -> CGC_ABI (Current Gold Cert).
 *           Product rebrand: USGold/USG -> Current Gold/CGC everywhere
 *           user-facing. The historical V1 legacy contract (a separate,
 *           already-deployed contract on Ethereum mainnet) keeps its real
 *           technical name in comments where that fact matters -- see
 *           useV1VaultBalance.js.
 * ==========================================================================*/

// Current (CRNT) — atomic ERC-20 (decimals = 0).
export const CRNT_ABI = [
    { type: 'function', name: 'name', stateMutability: 'pure',
      inputs: [], outputs: [{ type: 'string' }] },
    { type: 'function', name: 'balanceOf', stateMutability: 'view',
      inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'totalSupply', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'decimals', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'uint8' }] },
    { type: 'function', name: 'symbol', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'string' }] },
    { type: 'function', name: 'paused', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'isFrozen', stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'owner', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'address' }] },
    { type: 'function', name: 'pendingOwner', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'address' }] },
    { type: 'function', name: 'isMinter', stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'isPauser', stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'approve', stateMutability: 'nonpayable',
      inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
      outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'allowance', stateMutability: 'view',
      inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
      outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
      inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
      outputs: [{ type: 'bool' }] },
];

// Current Gold Cert (CGC) — ERC-721 (balance + ownership reads). Formerly
// branded "USGold"; renamed 2026-09-23 to match the current product name.
export const CGC_ABI = [
    { type: 'function', name: 'balanceOf', stateMutability: 'view',
      inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'setApprovalForAll', stateMutability: 'nonpayable',
      inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
      outputs: [] },
];

// Current Gold Vault (CGC Vault) — the Phase-1 atomic redemption vault
// (subset for the UI). Formerly branded "USGoldVault".
export const VAULT_ABI = [
    { type: 'function', name: 'eaglePriceCRNT', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'availableInventory', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'reserveBalance', stateMutability: 'view',
      inputs: [], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'swapIn', stateMutability: 'nonpayable',
      inputs: [], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'swapOut', stateMutability: 'nonpayable',
      inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [] },
];
