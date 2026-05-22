# Current Network — Cleanup & Rebuild Changelog

All work is tracked in git. Three milestones below, oldest first.

## Baseline
Original `Current-swap` repo as cloned. Did not install (server-side deps in a
browser app) and would not build.

---

## Cleanup Pass 1 — frontend builds clean
Goal: stop the bleeding, get a build with zero errors/warnings.

- **package.json** — removed phantom server-side deps (`sqlite3`, `fs`,
  `child_process`, `crypto`, `request`) that broke `npm install`; fixed the
  `start` script (was piping a non-existent `src/config.js`); dropped unused
  `react-notifications` / `react-toastr`; added `BigInt` ESLint global; relaxed
  the Node engine pin.
- **nav.js** — CRITICAL: removed the bare `onConnect()` in the render body (it
  ran every render → infinite wallet-popup loop); fixed the connect button that
  rendered a *function* as its label; stabilised the Web3Modal instance; fixed
  the broken disconnect handler.
- **utils/tokenMath.js** (new) — single source of truth for ATOMIC (0-decimal)
  Current math: `toDisplayAmount`, `toRawAmount`, `multiplyAtomic`, `hasEnough`,
  all BigInt-safe. Replaced every `fromWei`/`toWei` (÷/×1e18) that was wrong for
  an atomic token.
- **home.js** — atomic math; fixed dead error toasts; rejected fractional mint
  counts; removed a broken `import { off } from 'process'`.
- **vault.js / card.js** — removed unused vars, strict equality, error logging,
  empty states; replaced non-navigable `href="#"` anchors.
- **config-overrides.js** — added `zlib`/`path`/`fs` webpack fallbacks (a web3
  transitive dep broke the production build).
- **App.js / home.css / abi.js / tokenAbi.js / lockInstance.js** — removed the
  redundant notification container, fixed an invalid CSS `color()` value, named
  the ABI default exports, removed unused imports.
- **Removed dead code** — `src/pages/gallery/`, `public/useWeb3.js`,
  `public/web3Context.js`.

Result: `npm run build` → **compiled successfully, 0 errors, 0 warnings.**

---

## Phase 1 — Atomic USGold redemption vault (contract)
`contracts/USGoldVault.sol` (new, audit-oriented, full NatSpec):

- Two-way swap: `swapIn` (Current → USGold) and `swapOut` (USGold → Current at
  the *current* oracle Eagle price).
- Single reserve pool for solvency; `swapOut` reverts if the reserve can't pay.
- `eaglePriceCRNT` oracle in whole CRNT (weekly-feed friendly) + a
  max-change-per-update guard.
- Pausable, owner/priceFeeder role separation, ReentrancyGuard, CEI ordering.
- Constructor enforces `Current.decimals() == 0` (atomicity) at deploy time.
- FIFO inventory, ERC721Receiver auto-registration, paginated views for the UI.
- Supersedes the old `usgv2.sol` bonding-curve + reflection model.

`test/test-vault.js` — 17 checks, **all passing**: swap both directions, price
rise, solvency guard, price guard, pause.

`docs/USGOLD_VAULT_SPEC.md` — the agreed design captured.

---

## Phase 2 — Frontend rebuild (login + reporting + swap UI)

- **theme.css** (new) — cohesive black/white/gold design system; flex app shell
  that fixes the too-tall / needless-scroll issue; **global yellow highlight on
  every button**.
- **nav.js** — menu is now **Redeem / Account / Vault**; the old
  Connect/Connected/Disconnect trio replaced with a **small round wallet icon +
  address + Disconnect**; records login time + chainId on connect.
- **web3Context / useWeb3** — added `loginTime` + `chainId` session state.
- **useBalances.js** (new) — shared atomic balance hook (Current + USGold).
- **config/network.js** (new) — central chain + address config (CRNT from the
  repo connect data, USGold, Vault placeholder, 1:1 USD peg).
- **home.js** — repurposed into the **login dashboard**: access-verified badge,
  "Hello, user 0x…", thank-you blurb pointing to the menu, and official-looking
  wallet/session/network/balance tiles.
- **account/account.js** (new) — Current shown in **USD (1:1)** + USGold count.
- **redeem/redeem.js** (new) — USGold held + a **KYC form** that emails
  `redeem@currentnetwork.us`; on-chain transfer to the Vault activates once the
  Vault is deployed.
- **vault/vault.js** — rebuilt as a **FROM/TO swap box** (Current ⇄ USGold) with
  the informational content carried over from the old home page.
- Removed dead `info/` page and the old vault NFT card.

Result: `npm run build` → **compiled successfully, 0 warnings.**

---

## Known follow-ups (next rounds)
1. **Wallet stack is still WalletConnect v1 / web3modal (EOL).** Injected wallets
   (MetaMask/Binance) work; WalletConnect itself will not. Migrate to
   wagmi + viem + RainbowKit. This is the single most important next step.
2. **Bundle is ~940 kB.** Move to Vite + code splitting (Vercel-native).
3. **Deploy the Vault** to the target network, set `VAULT_ADDRESS`, and wire the
   swap + redeem on-chain transfer to the live contract.
4. **Vault solvency funding model** — confirm reserve top-up policy / spread.
5. **Audit** the vault before mainnet, and design the migration from the existing
   live contracts (the new atomic contracts are not state-compatible).
