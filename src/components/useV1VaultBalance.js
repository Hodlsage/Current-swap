/* ============================================================================
 * FILE: src/components/useV1VaultBalance.js
 * PURPOSE: Read the live balance of the legacy USGold V1 "old vault" wallet
 *          on Ethereum mainnet, for display on the Current Network Vault
 *          page (showing existing V1 holder volume that the new system needs
 *          to account for).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-06-12  Initial version.
 *     - Legacy USGold (USG) token contract: Ethereum mainnet,
 *       0x4000369AcfA25C8FE5d17fE3312e30C332beF633, decimals = 9 (confirmed
 *       via public token tracker; NOT the 0-decimal atomic model used by
 *       Current.sol).
 *     - "Old vault" wallet (consolidated V1 holder balance):
 *       0x08d43cc89A420C7E40c98a8BBb8096828C16Ab85.
 *     - INTENTIONALLY balanceOf(old vault wallet), NOT totalSupply(). The
 *       V1 token was over-minted relative to its real backing, so
 *       totalSupply() would overstate the figure; the old vault wallet's
 *       balance is the number that matters for migration planning.
 *     - This is a SEPARATE chain (Ethereum mainnet) from the rest of the app
 *       (Polygon, see config/wagmi.js). A dedicated read-only viem client is
 *       used here — this does NOT add Ethereum to wagmiConfig / the wallet
 *       connection, which remains single-chain Polygon per config/wagmi.js.
 * ----------------------------------------------------------------------------
 * NETWORK NOTE
 *   This sandbox cannot reach external RPC endpoints (Ethereum mainnet
 *   included), so this hook cannot be exercised here. It is written to "just
 *   work" once deployed somewhere with normal internet access (e.g. Vercel).
 *   Default RPC is a public endpoint; override via VITE_ETHEREUM_RPC_URL if
 *   that endpoint is rate-limited or blocked from your deployment.
 * ==========================================================================*/

import { useState, useEffect } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

// Legacy USGold (USG) V1 token contract on Ethereum mainnet.
export const V1_USGOLD_ADDRESS = '0x4000369AcfA25C8FE5d17fE3312e30C332beF633';
// 9 decimals, confirmed via public token tracker (NOT atomic / 0-decimal).
export const V1_USGOLD_DECIMALS = 9;
// The "old vault" wallet — consolidated balance of V1 USGold holders.
export const V1_OLD_VAULT_WALLET = '0x08d43cc89A420C7E40c98a8BBb8096828C16Ab85';

const V1_ABI = [
    { type: 'function', name: 'balanceOf', stateMutability: 'view',
      inputs: [{ name: '_owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
];

const mainnetClient = createPublicClient({
    chain: mainnet,
    // Configurable via VITE_ETHEREUM_RPC_URL (e.g. an Alchemy/Infura key) if
    // the default public endpoint is rate-limited or blocked from your
    // deployment.
    transport: http(import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'),
});

/**
 * Reads the live USG balance of the V1 "old vault" wallet on Ethereum
 * mainnet. Returns { balance, loading, error } where balance is a human-
 * readable string (already divided by 10^9), or null until loaded / on error.
 */
export function useV1VaultBalance() {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const raw = await mainnetClient.readContract({
                    address: V1_USGOLD_ADDRESS,
                    abi: V1_ABI,
                    functionName: 'balanceOf',
                    args: [V1_OLD_VAULT_WALLET],
                });
                if (!cancelled) {
                    setBalance(formatUnits(raw, V1_USGOLD_DECIMALS));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { balance, loading, error };
}
