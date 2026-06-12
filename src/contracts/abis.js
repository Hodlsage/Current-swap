/* ============================================================================
 * FILE: src/contracts/abis.js
 * PURPOSE: Minimal ABIs (only the functions the UI calls) for viem/wagmi.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — created. viem prefers compact, typed
 *           ABIs; we only include what the dashboard/account/redeem/vault read.
 *   v1.1.0  2026-06-11  CRNT_ABI extended for the new Current.sol: name,
 *           totalSupply, paused, isFrozen (status reads used by Home/Account).
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

// USGold — ERC-721 (balance + ownership reads).
export const USGOLD_ABI = [
    { type: 'function', name: 'balanceOf', stateMutability: 'view',
      inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'setApprovalForAll', stateMutability: 'nonpayable',
      inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
      outputs: [] },
];

// USGoldVault — the Phase-1 atomic redemption vault (subset for the UI).
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
