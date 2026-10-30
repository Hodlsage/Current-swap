/* ============================================================================
 * FILE: src/utils/walletReset.js
 * PURPOSE: Hard-reset the saved wallet connection. wagmi/RainbowKit remember
 *          the last connection in localStorage; if that saved record goes
 *          stale (wallet locked, extension restarted, site updated) the page
 *          can keep showing an old wallet that cannot sign or disconnect
 *          (error: "connector.getChainId is not a function"). Clearing the
 *          saved record and reloading fixes it; the user just reconnects.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-10-30  Created.
 * ==========================================================================*/

import { disconnect } from 'wagmi/actions';
import { wagmiConfig } from '../config/wagmi';

let resetting = false;

export async function resetWalletConnection() {
    if (resetting) return;
    resetting = true;
    try { await disconnect(wagmiConfig); } catch { /* stale connector -- fall through to clearing storage */ }
    try {
        Object.keys(localStorage)
            .filter((k) => /^(wagmi|rk-|WALLETCONNECT|wc@2)/i.test(k))
            .forEach((k) => localStorage.removeItem(k));
    } catch { /* storage blocked -- reload anyway */ }
    window.location.reload();
}

/** A live connector always has getChainId(); a stale saved one does not. */
export function isStaleConnector(connector) {
    return !!connector && typeof connector.getChainId !== 'function';
}
