/* ============================================================================
 * FILE: src/pages/vault/Vault.jsx
 * PAGE: Vault — custody reporting + FROM/TO swap box (Current <-> Current Gold) +
 *       info (wagmi).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — ported to wagmi hooks.
 *     - Reads live eaglePriceCRNT from the Vault when VAULT_ADDRESS is set;
 *       otherwise uses a preview price. Swap wires to writeContract once live.
 *   v1.1.0  2026-06-12  Added custody reporting section (certificates in
 *           custody, Eagle price, total custody value = count * price). Uses
 *           live Current Gold Vault reads when VAULT_ADDRESS is configured for
 *           the connected chain; otherwise falls back to legacy USGold (USG)
 *           reference data (see config/legacyVaultData.js) as filler -- "USGold"
 *           here refers to the real, already-deployed V1 legacy contract on
 *           Ethereum mainnet, which predates and is distinct from the current
 *           Current Gold Cert (CGC) system; its historical name is kept
 *           accurate rather than relabeled.
 *   v2.0.0  2026-06-12  "Certificates in Custody" now reads the LIVE balance
 *           of the legacy USGold V1 "old vault" wallet
 *           (0x08d43cc89A420C7E40c98a8BBb8096828C16Ab85) on Ethereum mainnet
 *           via useV1VaultBalance — this represents existing V1 holder
 *           volume that the new system accounts for. Deliberately
 *           balanceOf(old vault wallet), NOT totalSupply() (V1 was
 *           over-minted relative to backing; totalSupply() would overstate
 *           this figure). Falls back to the static LEGACY_VAULT_REFERENCE
 *           figure if the mainnet read is unavailable (e.g. this sandbox,
 *           which cannot reach external RPCs).
 *   v2.1.0  2026-06-12  Layout: "Total Custody Value" moved out of the
 *           cur-grid into its own full-width row below the other custody
 *           stats (Certificates in Custody / Eagle Price / CRNT Reserve),
 *           per request.
 *   v2.2.0  2026-09-23  Rebrand: USGold/USG -> Current Gold/CGC for
 *           everything describing the CURRENT system (DIR enum, swap UI
 *           labels, explainer copy). The real V1 legacy contract's
 *           historical "USGold" name is kept accurate in comments -- see the
 *           note above the imports. Also: the methodology/fallback-source
 *           disclosure that used to render as visible page text is now a
 *           code comment only (was two <p> blocks below the custody grid;
 *           see the comment in their place).
 * ==========================================================================*/

import React, { useState } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { useBalances } from '../../components/useBalances';
import { useV1VaultBalance } from '../../components/useV1VaultBalance';
import { getAddressesForChain } from '../../config/wagmi';
import { VAULT_ABI } from '../../contracts/abis';
// NOTE ON "USGold" IN THIS FILE: the real V1 legacy contract (Ethereum
// mainnet, see useV1VaultBalance.js) was genuinely deployed under the name
// "USGold" and predates the current rebrand -- that specific historical
// reference is kept accurate rather than relabeled. Everything describing
// the CURRENT system (labels, the swap UI, DIR enum, etc.) uses Current
// Gold / CGC per the 2026-09-23 rebrand.
import { LEGACY_VAULT_REFERENCE } from '../../config/legacyVaultData';
import { toDisplayAmount } from '../../utils/tokenMath';

const DIR = { CRNT_TO_CGC: 'CRNT_TO_CGC', CGC_TO_CRNT: 'CGC_TO_CRNT' };

export function Vault() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { VAULT_ADDRESS } = getAddressesForChain(chainId);
    const { currentBalance, cgcCount } = useBalances();

    const [direction, setDirection] = useState(DIR.CRNT_TO_CGC);
    const [amount, setAmount] = useState('');

    // Live Eagle price from the deployed vault (if configured), else preview.
    const priceRead = useReadContract({
        address: VAULT_ADDRESS || undefined,
        abi: VAULT_ABI,
        functionName: 'eaglePriceCRNT',
        query: { enabled: !!VAULT_ADDRESS },
    });

    // Live inventory + reserve from the deployed vault (if configured).
    const inventoryRead = useReadContract({
        address: VAULT_ADDRESS || undefined,
        abi: VAULT_ABI,
        functionName: 'availableInventory',
        query: { enabled: !!VAULT_ADDRESS },
    });

    const reserveRead = useReadContract({
        address: VAULT_ADDRESS || undefined,
        abi: VAULT_ABI,
        functionName: 'reserveBalance',
        query: { enabled: !!VAULT_ADDRESS },
    });

    // Live V1 USGold "old vault" wallet balance on Ethereum mainnet (see
    // useV1VaultBalance.js). This is the real legacy-holder volume figure.
    const v1Vault = useV1VaultBalance();

    const liveVaultAvailable = !!VAULT_ADDRESS && priceRead.data !== undefined;

    const eaglePrice = priceRead.data !== undefined
        ? Number(priceRead.data)
        : LEGACY_VAULT_REFERENCE.eaglePriceCRNT;

    // "Certificates in Custody" = live V1 old-vault wallet balance (USG,
    // 9 decimals, already converted by useV1VaultBalance), falling back to
    // the static reference figure if the mainnet read hasn't returned yet
    // or failed (e.g. sandboxes without external network access).
    const v1CertificatesAvailable = v1Vault.balance !== null && !v1Vault.error;

    const certificatesInCustody = v1CertificatesAvailable
        ? Number(v1Vault.balance)
        : LEGACY_VAULT_REFERENCE.certificatesInCustody;

    const totalCustodyValueCRNT = certificatesInCustody * eaglePrice;

    const reserveBalanceCRNT = reserveRead.data !== undefined
        ? Number(reserveRead.data)
        : null;

    const fromIsCurrent = direction === DIR.CRNT_TO_CGC;

    const flip = () => {
        setDirection((d) => (d === DIR.CRNT_TO_CGC ? DIR.CGC_TO_CRNT : DIR.CRNT_TO_CGC));
        setAmount('');
    };

    const toAmount = (() => {
        if (!/^\d+$/.test(amount) || Number(amount) <= 0) return '0';
        if (fromIsCurrent) return String(Math.floor(Number(amount) / eaglePrice));
        return String(Number(amount) * eaglePrice);
    })();

    const doSwap = () => {
        alert(
            VAULT_ADDRESS
                ? 'Swap submitted to the Vault.'
                : 'Vault contract not yet deployed on this network. Swap will activate once it is live.'
        );
    };

    return (
        <div className="cur-page">
            {/* ---- Custody reporting ---- */}
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <h2 style={{ marginTop: 0 }}>Vault Custody Report</h2>

                <div className="cur-grid">
                    <div className="cur-stat">
                        <div className="label">Certificates in Custody</div>
                        <div className="value gold">
                            {v1Vault.loading && !v1CertificatesAvailable
                                ? '…'
                                : certificatesInCustody.toLocaleString()}
                        </div>
                        <div style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 4 }}>
                            Each = 1 oz American Gold Eagle
                        </div>
                    </div>
                    <div className="cur-stat">
                        <div className="label">Current Eagle Price</div>
                        <div className="value gold">{eaglePrice.toLocaleString()} CRNT</div>
                        <div style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 4 }}>
                            1 CRNT = $1 USD
                        </div>
                    </div>
                    {reserveBalanceCRNT !== null && (
                        <div className="cur-stat">
                            <div className="label">CRNT Reserve (Vault)</div>
                            <div className="value gold">{reserveBalanceCRNT.toLocaleString()} CRNT</div>
                            <div style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 4 }}>
                                Available to fund swap-outs
                            </div>
                        </div>
                    )}
                </div>

                {/* Total Custody Value: full-width row, below the other stats */}
                <div className="cur-stat" style={{ marginTop: 18 }}>
                    <div className="label">Total Custody Value</div>
                    <div className="value gold">{totalCustodyValueCRNT.toLocaleString()} CRNT</div>
                    <div style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 4 }}>
                        {certificatesInCustody.toLocaleString()} &times; {eaglePrice.toLocaleString()} = {totalCustodyValueCRNT.toLocaleString()}
                    </div>
                </div>

                {/* Client rev 2026-09-23: this methodology/fallback-source note used
                  * to render as visible text on the page (two variants below, swapped
                  * based on v1CertificatesAvailable). Per request, it's no longer shown
                  * to users -- kept here as a comment instead, so the sourcing logic is
                  * still documented for whoever maintains this later.
                  *
                  * LIVE-DATA VARIANT (when v1CertificatesAvailable is true):
                  *   "Certificates in Custody" reflects the live USGold V1 balance held in
                  *   the legacy vault wallet on Ethereum (representing existing V1 holder
                  *   volume). Eagle price: [LEGACY_VAULT_REFERENCE.sourceNote -- see
                  *   config/legacyVaultData.js / eaglePricing.js for the current wording
                  *   and figures].
                  *
                  * FALLBACK VARIANT (when v1CertificatesAvailable is false):
                  *   Showing reference/fallback data ([LEGACY_VAULT_REFERENCE.label], as of
                  *   [LEGACY_VAULT_REFERENCE.asOf]). [LEGACY_VAULT_REFERENCE.sourceNote]
                  *   "Certificates in Custody" will switch automatically to the live USGold
                  *   V1 vault-wallet balance on Ethereum once that read succeeds (requires
                  *   external network access).
                  */}

                {!liveVaultAvailable && (
                    <p style={{ color: 'var(--cur-muted)', fontSize: '.8rem', marginTop: 8, marginBottom: 0 }}>
                        The swap mechanism below will activate once the Current Gold Vault contract is
                        deployed and configured for this network.
                    </p>
                )}
            </div>

            {/* ---- Swap box ---- */}
            <div className="cur-card" style={{ maxWidth: 560, margin: '0 auto 22px' }}>
                <h2>Swap</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="swap-row">
                        <input type="number" min="0" step="1" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        <span className="swap-token">{fromIsCurrent ? 'CRNT' : 'CGC'}</span>
                    </div>
                    <button className="swap-flip" type="button" onClick={flip} title="Flip direction" aria-label="Flip swap direction">⇅</button>
                    <div className="swap-row">
                        <input type="text" readOnly value={toAmount} />
                        <span className="swap-token">{fromIsCurrent ? 'CGC' : 'CRNT'}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cur-muted)', fontSize: '.85rem', margin: '14px 0' }}>
                    <span>Eagle price: <strong style={{ color: 'var(--cur-gold)' }}>{eaglePrice} CRNT</strong></span>
                    <span>You hold: {toDisplayAmount(currentBalance)} CRNT · {toDisplayAmount(cgcCount)} CGC</span>
                </div>

                <button
                    className="cur-btn cur-btn--solid"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={!isConnected || !/^\d+$/.test(amount) || Number(amount) <= 0}
                    onClick={doSwap}
                >
                    Swap
                </button>
            </div>

            <div className="cur-card">
                <h2 style={{ fontSize: '1.1rem' }}>How the Vault works</h2>
                <p style={{ color: 'var(--cur-muted)' }}>
                    The Vault holds a reserve of Current&trade; and a pre-minted inventory of
                    Current Gold&trade; certificates. Swap <strong style={{ color: 'var(--cur-gold)' }}>Current &rarr; Current Gold</strong>{' '}
                    to acquire a certificate at the current American Gold Eagle price, or swap{' '}
                    <strong style={{ color: 'var(--cur-gold)' }}>Current Gold &rarr; Current</strong> to return
                    a certificate and receive the live Eagle price in Current.
                </p>
                <p style={{ color: 'var(--cur-muted)', margin: 0 }}>
                    Because the Eagle price updates weekly from the US Mint, a certificate acquired at
                    one price can be redeemed for Current at the price in effect when you swap back
                    &mdash; your certificate tracks the spot value of gold.
                </p>
            </div>
        </div>
    );
}
