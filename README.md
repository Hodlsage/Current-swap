# Current Network — Web3 App (Vite + wagmi + RainbowKit)

Modern wallet-gated dApp for the Current (CRNT) atomic dollar token and USGold
certificates, targeting **BNB Smart Chain Testnet (chainId 97)**.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Build for production (Vercel-ready; output in `build/`):

```bash
npm run build
npm run preview
```

## Testing the wallet login (MetaMask on Opera / Firefox)

1. Open http://localhost:3000 — because the whole app is wallet-gated, you'll
   see the **Connect your wallet** screen first.
2. Click **Connect Wallet** → the RainbowKit modal opens → choose **MetaMask**.
3. If MetaMask isn't on BNB testnet, it will prompt you to switch/add chain 97.
4. Get test BNB from a faucet (e.g. search "BNB testnet faucet") and paste your
   address — you need a little tBNB for gas to test swaps later.
5. Once connected you land on **Home** (the dashboard). Try the menu:
   - **Account** — your Current balance shown in USD (1:1) + USGold count
   - **Redeem** — KYC form that emails redeem@currentnetwork.us
   - **Vault** — the Current ⇄ USGold swap box

Disconnect via the account pill in the top-right (RainbowKit's built-in modal).

## Auth gate

Every route is wrapped in `RequireWallet` (see `src/App.jsx`). With no wallet
connected, any page renders the forced-connect screen instead. The app assumes
the user arrives here after hitting "connect" on the marketing site.

## Enabling WalletConnect (optional)

MetaMask/injected wallets work out of the box. To enable the WalletConnect
option in the modal, get a free projectId at https://cloud.walletconnect.com,
copy `.env.example` to `.env`, and set `VITE_WALLETCONNECT_PROJECT_ID`.

## Contract addresses (BNB testnet)

Set in `src/config/wagmi.js`:
- Current (CRNT): `0x7Ce8E3780F6C688C11039917f40563ECFDCCd0d8`
- USGold:        `0x1EDA76120d64d45F693AD6730c54d5E08852a734`
- Vault:         *(empty — set after deploying `USGoldVault.sol`)*

When the vault is deployed, paste its address into `VAULT_ADDRESS` and the
Vault page will read the live Eagle price and the swap goes live.
