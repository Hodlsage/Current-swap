/* ============================================================================
 * FILE: src/components/Footer.jsx
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — simplified footer for the Vite build.
 * ==========================================================================*/

import React from 'react';

export function Footer() {
    return (
        <footer className="cur-footer">
            <div className="cur-footer__inner">
                <a href="https://currentnetwork.us/" className="cur-brand" style={{ fontSize: '.95rem' }}>
                    CURRENT<span>NETWORK</span>
                </a>
                <span style={{ color: 'var(--cur-muted)', fontSize: '.8rem' }}>
                    © 2026 Current Network
                </span>
            </div>
        </footer>
    );
}
