/* ============================================================================
 * FILE: src/pages/redeem/Redeem.jsx
 * PAGE: Redeem — USGold held + KYC form -> kyc@currentnetwork.us (wagmi).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — ported to wagmi hooks.
 *   v1.1.0  2026-06-12  Expanded KYC form: date of birth, phone number, ID
 *           type + ID number, in addition to name/email/shipping address/qty.
 * ==========================================================================*/

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useBalances } from '../../components/useBalances';
import { VAULT_ADDRESS } from '../../config/wagmi';
import { toDisplayAmount } from '../../utils/tokenMath';

const REDEEM_EMAIL = 'kyc@currentnetwork.us';

const ID_TYPES = [
    { value: '', label: 'Select ID type...' },
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'national_id', label: 'National ID Card' },
    { value: 'state_id', label: 'State-Issued ID' },
];

export function Redeem() {
    const { address } = useAccount();
    const { usgoldCount } = useBalances();
    const held = Number(toDisplayAmount(usgoldCount));

    const [form, setForm] = useState({
        name: '',
        email: '',
        dob: '',
        phone: '',
        idType: '',
        idNumber: '',
        address: '',
        quantity: '1',
    });
    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const qtyValid = /^\d+$/.test(form.quantity) && Number(form.quantity) > 0 && Number(form.quantity) <= held;
    const dobValid = !!form.dob; // browser date input enforces format
    const formValid =
        form.name &&
        form.email &&
        dobValid &&
        form.phone &&
        form.idType &&
        form.idNumber &&
        form.address &&
        qtyValid;

    const idTypeLabel = ID_TYPES.find((t) => t.value === form.idType)?.label || '';

    const submit = () => {
        const subject = encodeURIComponent(`USGold Redemption Request — ${form.quantity} coin(s)`);
        const body = encodeURIComponent(
            `USGold Redemption Request\n--------------------------------\n` +
            `Wallet: ${address}\nCertificates held: ${held}\n` +
            `Quantity to redeem: ${form.quantity}\n\nKYC Details\n` +
            `Full name: ${form.name}\nEmail: ${form.email}\n` +
            `Date of birth: ${form.dob}\nPhone: ${form.phone}\n` +
            `ID type: ${idTypeLabel}\nID number: ${form.idNumber}\n` +
            `Shipping address:\n${form.address}\n\n` +
            `On confirmation, ${form.quantity} USGold certificate(s) will be sent to the ` +
            `Current Network Vault and the corresponding American Gold Eagle coin(s) shipped.\n`
        );
        window.location.href = `mailto:${REDEEM_EMAIL}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="cur-page">
            <div className="cur-grid" style={{ marginBottom: 22 }}>
                <div className="cur-stat">
                    <div className="label">USGold Certificates Held</div>
                    <div className="value gold">{held}</div>
                </div>
                <div className="cur-stat">
                    <div className="label">Each Redeems For</div>
                    <div className="value">1 oz American Gold Eagle</div>
                </div>
            </div>

            <div className="cur-card">
                <h2>Redeem for physical coins</h2>
                <p style={{ color: 'var(--cur-muted)' }}>
                    Complete the KYC details below to request delivery of your American Gold Eagle
                    coin(s). Your request is sent to our compliance desk
                    (<span style={{ color: 'var(--cur-gold)' }}>{REDEEM_EMAIL}</span>) and your USGold
                    certificate(s) will be transferred into the Vault on confirmation.
                </p>

                <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
                    <label>
                        <div className="redeem-label">Full legal name</div>
                        <input className="redeem-input" value={form.name} onChange={update('name')} placeholder="Jane Doe" />
                    </label>
                    <label>
                        <div className="redeem-label">Email</div>
                        <input className="redeem-input" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
                    </label>
                    <label>
                        <div className="redeem-label">Date of birth</div>
                        <input className="redeem-input" type="date" value={form.dob} onChange={update('dob')} />
                    </label>
                    <label>
                        <div className="redeem-label">Phone number</div>
                        <input className="redeem-input" type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 555 555 5555" />
                    </label>
                    <label>
                        <div className="redeem-label">Government-issued ID type</div>
                        <select className="redeem-input" value={form.idType} onChange={update('idType')}>
                            {ID_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <div className="redeem-label">ID number</div>
                        <input className="redeem-input" value={form.idNumber} onChange={update('idNumber')} placeholder="ID / document number" />
                    </label>
                    <label>
                        <div className="redeem-label">Shipping address</div>
                        <textarea className="redeem-input" rows={3} value={form.address} onChange={update('address')} placeholder="Street, City, State, ZIP, Country" />
                    </label>
                    <label>
                        <div className="redeem-label">Quantity to redeem (max {held})</div>
                        <input className="redeem-input" type="number" min="1" step="1" max={held} value={form.quantity} onChange={update('quantity')} />
                        {!qtyValid && form.quantity !== '' && (
                            <div style={{ color: '#ff6b6b', fontSize: '.8rem', marginTop: 4 }}>
                                Enter a whole number between 1 and {held}.
                            </div>
                        )}
                    </label>

                    <button className="cur-btn cur-btn--solid" disabled={!formValid} onClick={submit}>
                        Submit Redemption Request
                    </button>

                    <p style={{ color: 'var(--cur-muted)', fontSize: '.8rem', margin: 0 }}>
                        Your information is used solely for identity verification and shipment of
                        physical coins, in line with our compliance obligations. Do not include
                        photos or scans of identity documents in this form &mdash; our compliance
                        team will follow up with a secure upload link if required.
                    </p>

                    {!VAULT_ADDRESS && (
                        <p style={{ color: 'var(--cur-muted)', fontSize: '.8rem', margin: 0 }}>
                            Note: on-chain transfer to the Vault activates once the Vault contract is
                            deployed. Your request will still be emailed to the compliance desk.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
