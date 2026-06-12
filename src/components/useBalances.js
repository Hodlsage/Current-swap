/* ============================================================================
 * FILE: src/components/useBalances.js
 * PURPOSE: Read the connected wallet's atomic Current balance + USGold count
 *          via wagmi v2 hooks. Atomic: no fromWei.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — reimplemented on wagmi useReadContract
 *           (replaces the web3.js version). Auto-refetches on block/account.
 *   v1.1.0  2026-06-11  Resolves contract addresses per connected chainId via
 *           getAddressesForChain (supports local Hardhat sandbox + Amoy).
 *           USGold balance read is skipped when no USGold address is set for
 *           the active chain (not deployed in this round).
 * ==========================================================================*/

import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getAddressesForChain } from '../config/wagmi';
import { CRNT_ABI, USGOLD_ABI } from '../contracts/abis';
import { toDisplayAmount } from '../utils/tokenMath';

export function useBalances() {
    const { address } = useAccount();
    const chainId = useChainId();
    const { CRNT_ADDRESS, USGOLD_ADDRESS } = getAddressesForChain(chainId);

    const crnt = useReadContract({
        address: CRNT_ADDRESS || undefined,
        abi: CRNT_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address && !!CRNT_ADDRESS },
    });

    const usgold = useReadContract({
        address: USGOLD_ADDRESS || undefined,
        abi: USGOLD_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address && !!USGOLD_ADDRESS },
    });

    return {
        // ATOMIC: the raw uint256 IS the human amount. BigInt -> string.
        currentBalance: crnt.data !== undefined ? toDisplayAmount(crnt.data) : '0',
        usgoldCount: usgold.data !== undefined ? toDisplayAmount(usgold.data) : '0',
        loading: crnt.isLoading || usgold.isLoading,
        refresh: () => { crnt.refetch(); usgold.refetch(); },
    };
}
