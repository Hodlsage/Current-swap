/* ============================================================================
 * FILE: src/pages/admin/Admin.jsx
 * PAGE: Admin -- record money in (wire / ACH / stablecoin / other) for a user
 *       wallet, review all deposits, void mistakes. Visible only to wallets
 *       listed in the ADMIN_WALLETS env var; the API enforces it too, so
 *       hiding the UI is a convenience, not the security.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-10-22  Created. Rows are never deleted -- voiding keeps the
 *           record (with reason) and removes it from totals.
 * ==========================================================================*/

import React, { useCallback, useEffect, useState } from 'react';
import { useSiweAuth } from '../../components/useSiweAuth';
import { METHOD_LABELS, fmtUSD, fmtDate } from '../../components/MoneyIn';

const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ wallet: '', amount: '', method: 'wire', reference: '', received_at: today() });

export function Admin() {
    const { status, error, profile, signIn } = useSiweAuth();
    const [form, setForm] = useState(blank());
    const [filter, setFilter] = useState('');
    const [data, setData] = useState(null);
    const [msg, setMsg] = useState(null); // { ok, text }
    const [busy, setBusy] = useState(false);
    const [voiding, setVoiding] = useState(null); // deposit id
    const [reason, setReason] = useState('');

    const isAdmin = status === 'signed_in' && profile?.is_admin;

    const load = useCallback(async () => {
        const q = filter.trim() ? `?wallet=${encodeURIComponent(filter.trim())}` : '';
        const r = await fetch(`/api/admin/deposits${q}`, { credentials: 'include' });
        if (r.ok) setData(await r.json());
        else setMsg({ ok: false, text: 'Could not load deposits.' });
    }, [filter]);

    useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

    const post = async (body) => {
        const r = await fetch('/api/admin/deposits', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Something went wrong.');
        return j;
    };

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setMsg(null);
        try {
            await post({ action: 'create', ...form });
            setMsg({ ok: true, text: 'Deposit recorded.' });
            setForm({ ...blank(), wallet: form.wallet });
            await load();
        } catch (err) { setMsg({ ok: false, text: err.message }); }
        setBusy(false);
    };

    const doVoid = async (id) => {
        setBusy(true); setMsg(null);
        try {
            await post({ action: 'void', id, reason });
            setVoiding(null); setReason('');
            setMsg({ ok: true, text: 'Deposit voided.' });
            await load();
        } catch (err) { setMsg({ ok: false, text: err.message }); }
        setBusy(false);
    };

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    if (status === 'checking') return <div className="cur-page"><p style={{ color: 'var(--cur-muted)' }}>Loading...</p></div>;

    if (status !== 'signed_in') {
        return (
            <div className="cur-page">
                <div className="cur-card">
                    <h2>Admin</h2>
                    <p style={{ color: 'var(--cur-muted)' }}>Verify your wallet to continue.</p>
                    <button className="cur-btn cur-btn--solid" onClick={signIn} disabled={status === 'signing_in'}>
                        {status === 'signing_in' ? 'Check your wallet...' : 'Verify wallet'}
                    </button>
                    {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return <div className="cur-page"><div className="cur-card"><h2>Admin</h2><p style={{ color: 'var(--cur-muted)', margin: 0 }}>This wallet does not have admin access.</p></div></div>;
    }

    return (
        <div className="cur-page">
            <div className="cur-card" style={{ marginBottom: 22 }}>
                <h2>Record money in</h2>
                <form onSubmit={submit}>
                    <div className="cur-grid">
                        <div>
                            <div className="redeem-label">User wallet</div>
                            <input className="redeem-input" value={form.wallet} onChange={set('wallet')} placeholder="0x..." required />
                        </div>
                        <div>
                            <div className="redeem-label">Amount (USD)</div>
                            <input className="redeem-input" type="number" step="0.01" min="0.01" value={form.amount} onChange={set('amount')} required />
                        </div>
                        <div>
                            <div className="redeem-label">Method</div>
                            <select className="redeem-input" value={form.method} onChange={set('method')}>
                                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <div className="redeem-label">Date received</div>
                            <input className="redeem-input" type="date" value={form.received_at} onChange={set('received_at')} required />
                        </div>
                        <div>
                            <div className="redeem-label">Reference (optional)</div>
                            <input className="redeem-input" value={form.reference} onChange={set('reference')} placeholder="Wire ref / tx hash" maxLength={200} />
                        </div>
                    </div>
                    <button className="cur-btn cur-btn--solid" type="submit" disabled={busy} style={{ marginTop: 16 }}>
                        {busy ? 'Saving...' : 'Record deposit'}
                    </button>
                    {msg && <p style={{ color: msg.ok ? '#4ade80' : '#ff6b6b', marginBottom: 0 }}>{msg.text}</p>}
                </form>
            </div>

            <div className="cur-card">
                <h2>All deposits</h2>
                <div className="redeem-label">Filter by wallet (blank = everyone)</div>
                <input className="redeem-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="0x..." style={{ marginBottom: 14 }} />
                {data && data.deposits.length === 0 && <p style={{ color: 'var(--cur-muted)', margin: 0 }}>No deposits found.</p>}
                {data && data.deposits.length > 0 && (
                    <div className="cur-ledger-wrap">
                        <table className="cur-ledger">
                            <thead>
                                <tr><th>Date</th><th>Wallet</th><th>Method</th><th>Reference</th><th className="num">Amount</th><th className="num">Wallet running total</th><th /></tr>
                            </thead>
                            <tbody>
                                {data.deposits.map((d) => (
                                    <React.Fragment key={d.id}>
                                        <tr className={d.status === 'voided' ? 'is-void' : ''}>
                                            <td>{fmtDate(d.received_at)}</td>
                                            <td title={d.wallet_address}>{d.wallet_address.slice(0, 6)}…{d.wallet_address.slice(-4)}</td>
                                            <td>{METHOD_LABELS[d.method] || d.method}</td>
                                            <td>{d.reference || '—'}</td>
                                            <td className="num">{fmtUSD(d.amount_usd)}</td>
                                            <td className="num">{fmtUSD(d.running_total)}</td>
                                            <td>
                                                {d.status === 'voided'
                                                    ? <span title={d.void_reason}>Voided</span>
                                                    : <button className="cur-btn" onClick={() => { setVoiding(d.id); setReason(''); }}>Void</button>}
                                            </td>
                                        </tr>
                                        {voiding === d.id && (
                                            <tr>
                                                <td colSpan={7}>
                                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                        <input className="redeem-input" style={{ flex: '1 1 220px' }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for voiding" maxLength={200} />
                                                        <button className="cur-btn cur-btn--solid" disabled={busy} onClick={() => doVoid(d.id)}>Confirm void</button>
                                                        <button className="cur-btn" onClick={() => setVoiding(null)}>Cancel</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
