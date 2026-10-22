/* ============================================================================
 * FILE: src/components/MoneyIn.jsx
 * PURPOSE: "Money In" ledger on the Account page -- every wire / ACH /
 *          stablecoin deposit recorded for the signed-in wallet, newest first,
 *          with a rolling total. Read-only; deposits are entered by an admin
 *          on /admin. Needs the signed session (not just a connected wallet).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-10-22  Created.
 * ==========================================================================*/

import React, { useEffect, useState } from 'react';
import { useSiweAuth } from './useSiweAuth';

export const METHOD_LABELS = { wire: 'Wire', ach: 'ACH', stablecoin: 'Stablecoin', other: 'Other' };
export const fmtUSD = (n) => Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
export const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' });

export function MoneyIn() {
    const { status, error, signIn } = useSiweAuth();
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (status !== 'signed_in') { setData(null); return; }
        setLoadError(false);
        fetch('/api/deposits', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(setData)
            .catch(() => setLoadError(true));
    }, [status]);

    return (
        <div className="cur-card" style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Money In</h2>

            {status === 'checking' && <p style={{ color: 'var(--cur-muted)', margin: 0 }}>Loading...</p>}

            {(status === 'signed_out' || status === 'signing_in') && (
                <>
                    <p style={{ color: 'var(--cur-muted)', marginTop: 0 }}>
                        Verify your wallet to see the wires, ACH and stablecoin deposits received for your account.
                    </p>
                    <button className="cur-btn cur-btn--solid" onClick={signIn} disabled={status === 'signing_in'}>
                        {status === 'signing_in' ? 'Check your wallet...' : 'Verify wallet'}
                    </button>
                    {error && <p style={{ color: '#ff6b6b', marginBottom: 0 }}>{error}</p>}
                </>
            )}

            {status === 'signed_in' && loadError && (
                <p style={{ color: '#ff6b6b', margin: 0 }}>Could not load your deposits right now.</p>
            )}

            {status === 'signed_in' && data && (
                <>
                    <div className="cur-stat" style={{ marginBottom: 14 }}>
                        <div className="label">Total received</div>
                        <div className="value gold">{fmtUSD(data.total)}</div>
                    </div>
                    {data.deposits.length === 0 ? (
                        <p style={{ color: 'var(--cur-muted)', margin: 0 }}>No deposits recorded yet.</p>
                    ) : (
                        <div className="cur-ledger-wrap">
                            <table className="cur-ledger">
                                <thead>
                                    <tr><th>Date</th><th>Method</th><th>Reference</th><th className="num">Amount</th><th className="num">Running total</th></tr>
                                </thead>
                                <tbody>
                                    {data.deposits.map((d) => (
                                        <tr key={d.id}>
                                            <td>{fmtDate(d.received_at)}</td>
                                            <td>{METHOD_LABELS[d.method] || d.method}</td>
                                            <td>{d.reference || '—'}</td>
                                            <td className="num">{fmtUSD(d.amount_usd)}</td>
                                            <td className="num">{fmtUSD(d.running_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
