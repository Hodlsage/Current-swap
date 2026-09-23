/* ============================================================================
 * FILE: src/components/useBalances.js
 * PURPOSE: Read the connected wallet's atomic Current balance + Current Gold
 *          Cert (CGC) count via wagmi v2 hooks. Atomic: no fromWei.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — reimplemented on wagmi useReadContract
 *           (replaces the web3.js version). Auto-refetches on block/account.
 *   v1.1.0  2026-06-11  Resolves contract addresses per connected chainId via
 *           getAddressesForChain (supports local Hardhat sandbox + Amoy).
 *           USGold balance read is skipped when no USGold address is set for
 *           the active chain (not deployed in this round).
 *   v1.2.0  2026-06-12  Returns `error` (first of crnt/usgold read errors, or
 *           null) so the UI can distinguish "RPC read failed" from "balance
 *           is genuinely 0" instead of treating both the same.
 *   v1.3.0  2026-09-23  Rebrand: USGold/USG -> Current Gold/CGC. Renamed
 *           USGOLD_ABI -> CGC_ABI, USGOLD_ADDRESS -> CGC_ADDRESS, and the
 *           returned usgoldCount key -> cgcCount. Every consumer of this
 *           hook (Home/Account/Redeem/Card/Vault) updated to match.
 * ==========================================================================*/

import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getAddressesForChain } from '../config/wagmi';
import { CRNT_ABI, CGC_ABI } from '../contracts/abis';
import { toDisplayAmount } from '../utils/tokenMath';

export function useBalances() {
    const { address } = useAccount();
    const chainId = useChainId();
    const { CRNT_ADDRESS, CGC_ADDRESS } = getAddressesForChain(chainId);

    const crnt = useReadContract({
        address: CRNT_ADDRESS || undefined,
        abi: CRNT_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address && !!CRNT_ADDRESS },
    });

    const cgc = useReadContract({
        address: CGC_ADDRESS || undefined,
        abi: CGC_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address && !!CGC_ADDRESS },
    });

    return {
        // ATOMIC: the raw uint256 IS the human amount. BigInt -> string.
        currentBalance: crnt.data !== undefined ? toDisplayAmount(crnt.data) : '0',
        cgcCount: cgc.data !== undefined ? toDisplayAmount(cgc.data) : '0',
        loading: crnt.isLoading || cgc.isLoading,
        // Surfaced so the UI can distinguish "really zero" from "read
        // failed" (e.g. RPC outage) rather than silently showing 0 in both
        // cases.
        error: crnt.error || cgc.error || null,
        refresh: () => { crnt.refetch(); cgc.refetch(); },
    };
}
