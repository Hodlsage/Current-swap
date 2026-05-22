/* ============================================================================
 * FILE: src/components/useBalances.js
 * PURPOSE: Read the connected wallet's atomic Current balance and USGold count.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Cleanup pass 2 — created.
 *     - One shared hook used by Home / Account / Redeem / Vault so balance
 *       reads are consistent and atomic (no fromWei). Re-reads on wallet change.
 * ==========================================================================*/

import { useCallback, useEffect, useState } from 'react';
import useWeb3 from './useWeb3';
import tokenAbi from '../contracts/tokenAbi';
import abi from '../contracts/abi';
import { CRNT_ADDRESS, USGOLD_ADDRESS } from '../config/network';
import { toDisplayAmount } from '../utils/tokenMath';

export default function useBalances() {
    const { web3, walletAddress } = useWeb3();
    const [currentBalance, setCurrentBalance] = useState("0"); // atomic whole CRNT
    const [usgoldCount, setUsgoldCount] = useState("0");
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!web3 || !walletAddress) {
            setCurrentBalance("0");
            setUsgoldCount("0");
            return;
        }
        setLoading(true);
        try {
            const crnt = new web3.eth.Contract(tokenAbi, CRNT_ADDRESS);
            const bal = await crnt.methods.balanceOf(walletAddress).call();
            setCurrentBalance(toDisplayAmount(bal)); // ATOMIC: no fromWei

            try {
                const usg = new web3.eth.Contract(abi, USGOLD_ADDRESS);
                const count = await usg.methods.balanceOf(walletAddress).call();
                setUsgoldCount(toDisplayAmount(count));
            } catch (e) {
                console.warn("USGold balance read failed:", e);
                setUsgoldCount("0");
            }
        } catch (e) {
            console.warn("Current balance read failed:", e);
            setCurrentBalance("0");
        } finally {
            setLoading(false);
        }
    }, [web3, walletAddress]);

    useEffect(() => { refresh(); }, [refresh]);

    return { currentBalance, usgoldCount, loading, refresh };
}
