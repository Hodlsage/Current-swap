/* ============================================================================
 * FILE: src/components/web3Context.js
 * PURPOSE: App-wide Web3 + session state (wallet, web3 instance, login time).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Cleanup pass 2
 *     - Added `loginTime`, `chainId` to the shared context so the Home
 *       dashboard can show login confirmation + session "fluff" data, and other
 *       pages can read connection details without re-querying.
 *   v0.1.0  Original as cloned.
 * ==========================================================================*/

import React, { useState } from "react";

export const web3Context = React.createContext();

export const Web3ContextProvider = ({ children }) => {
    const [web3, setWeb3] = useState();
    const [walletAddress, setWalletAddress] = useState("");
    // Session metadata used by the dashboard.
    const [loginTime, setLoginTime] = useState(null);   // Date | null
    const [chainId, setChainId] = useState("");

    return (
        <web3Context.Provider
            value={{
                web3,
                walletAddress,
                loginTime,
                chainId,
                setWeb3,
                setWalletAddress,
                setLoginTime,
                setChainId,
            }}
        >
            {children}
        </web3Context.Provider>
    );
};
