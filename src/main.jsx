/* ============================================================================
 * FILE: src/main.jsx
 * PURPOSE: App entry. Wires the modern wallet stack provider tree.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — created during wagmi/RainbowKit
 *           migration. Provider order matters: Wagmi -> QueryClient ->
 *           RainbowKit -> Router -> App.
 * ==========================================================================*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { wagmiConfig } from './config/wagmi';
import App from './App';
import './theme.css';

const queryClient = new QueryClient();

// RainbowKit themed to match the Current black/gold scheme.
const currentTheme = darkTheme({
    accentColor: '#f5c518',
    accentColorForeground: '#0d0d0d',
    borderRadius: 'medium',
    overlayBlur: 'small',
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={currentTheme}>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>
);
