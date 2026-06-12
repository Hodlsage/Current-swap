/* ============================================================================
 * FILE: vite.config.js
 * REVISION CONTROL
 *   v1.0.0  2026-05-22  Cleanup pass 3 — migrated from CRA/react-app-rewired to
 *           Vite. Vercel-native, no polyfill hacks needed for the wagmi stack.
 * ==========================================================================*/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: { outDir: 'build' },   // keep Vercel/CRA-compatible output dir
});
