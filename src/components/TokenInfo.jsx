/* ============================================================================
 * FILE: src/components/TokenInfo.jsx
 * PURPOSE: Public, wallet-independent transparency panel -- surfaces every
 *          CRNT contract read that wasn't already shown anywhere in the UI
 *          (totalSupply, paused, owner, pendingOwner, plus whether the
 *          *connected* wallet holds minter/pauser rights). All of this is
 *          public on-chain state; nothing here requires a connected wallet
 *          except the two "does MY wallet have X role" reads.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-09-23  Created. See abis.js v1.2.0 for the ABI additions
 *           this depends on (owner, pendingOwner, isMinter, isPauser).
 *           Markup/classes copied from Vault.jsx's cur-stat blocks (.cur-card
 *           / .cur-grid / .cur-stat > .label + .value) to match existing
 *           conventions rather than inventing new class names.
 * ==========================================================================*/

import React from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getAddressesForChain } from '../config/wagmi';
import { CRNT_ABI } from '../contracts/abis';
import { toDisplayAmount } from '../utils/tokenMath';

function shortenAddress(addr) {
    if (!addr) return '—';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function TokenInfo() {
    const { address: connectedAddress } = useAccount();
    const chainId = useChainId();
    const { CRNT_ADDRESS } = getAddressesForChain(chainId);
    const enabled = !!CRNT_ADDRESS;

    const totalSupplyRead = useReadContract({
        address: CRNT_ADDRESS || undefined, abi: CRNT_ABI,
        functionName: 'totalSupply', query: { enabled },
    });
    const pausedRead = useReadContract({
        address: CRNT_ADDRESS || undefined, abi: CRNT_ABI,
        functionName: 'paused', query: { enabled },
    });
    const ownerRead = useReadContract({
        address: CRNT_ADDRESS || undefined, abi: CRNT_ABI,
        functionName: 'owner', query: { enabled },
    });
    const pendingOwnerRead = useReadContract({
        address: CRNT_ADDRESS || undefined, abi: CRNT_ABI,
        functionName: 'pendingOwner', query: { enabled },
    });
    const isMinterRead = useReadContract({
        address: CRNT_ADDRESS || undefined, abi: CRNT_ABI,
        functionName: 'isMinter', args: [connectedAddress],
        query: { enabled: enabled && !!connectedAddress },
    });
    const isPauserRead = useReadContract({
        address: CRNT_ADDRESS || undefined, abi: CRNT_ABI,
        functionName: 'isPauser', args: [connectedAddress],
        query: { enabled: enabled && !!connectedAddress },
    });

    if (!enabled) return null;

    const ZERO = '0x0000000000000000000000000000000000000000';
    const hasPendingOwner = pendingOwnerRead.data && pendingOwnerRead.data !== ZERO;

    return (
        <section className="cur-card">
            <h2>Token Info</h2>
            <div style={{ color: 'var(--cur-muted)', fontSize: '.85rem', marginBottom: 14 }}>
                Public contract state — anyone can verify this independently on
                PolygonScan.
            </div>

            <div className="cur-grid">
                <div className="cur-stat">
                    <div className="label">Total Supply</div>
                    <div className="value gold">
                        {totalSupplyRead.data !== undefined
                            ? `${toDisplayAmount(totalSupplyRead.data)} CRNT`
                            : '—'}
                    </div>
                </div>

                <div className="cur-stat">
                    <div className="label">Contract Status</div>
                    <div className="value">
                        {pausedRead.data === undefined ? '—' : pausedRead.data ? 'Paused' : 'Active'}
                    </div>
                </div>

                <div className="cur-stat">
                    <div className="label">Owner</div>
                    <div className="value" title={ownerRead.data}>
                        {shortenAddress(ownerRead.data)}
                    </div>
                </div>

                {hasPendingOwner && (
                    <div className="cur-stat">
                        <div className="label">Pending Owner</div>
                        <div className="value" title={pendingOwnerRead.data}>
                            {shortenAddress(pendingOwnerRead.data)}
                        </div>
                    </div>
                )}
            </div>

            {connectedAddress && (
                <div className="cur-grid" style={{ marginTop: 18 }}>
                    <div className="cur-stat">
                        <div className="label">Your Wallet — Minter</div>
                        <div className="value">
                            {isMinterRead.data === undefined ? '—' : isMinterRead.data ? 'Yes' : 'No'}
                        </div>
                    </div>
                    <div className="cur-stat">
                        <div className="label">Your Wallet — Pauser</div>
                        <div className="value">
                            {isPauserRead.data === undefined ? '—' : isPauserRead.data ? 'Yes' : 'No'}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
