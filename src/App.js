/* ============================================================================
 * FILE: src/App.js
 * ROOT application component: providers + router + page routes.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.3.0  2026-05-22  Cleanup pass 2 (scope change)
 *     - Routes reworked: Home (dashboard), /redeem, /account, /vault.
 *     - Removed the old /info route and page.
 *     - Imported the cohesive theme.css design system.
 *   v0.2.0  Removed redundant notification container.
 *   v0.1.0  Original as cloned.
 * ==========================================================================*/

import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

import { Home } from './pages/home/home';
import { Redeem } from './pages/redeem/redeem';
import { Account } from './pages/account/account';
import { Vault } from './pages/vault/vault';
import { Nav } from './components/nav';
import { Footer } from './components/footer';
import { Web3ContextProvider } from "./components/web3Context";
import './theme.css';
import './App.css';

function App() {
  return (
    <Web3ContextProvider>
      <Router>
        <div className="currentswap-main">
          <Nav />
          <div className="page-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/redeem" element={<Redeem />} />
              <Route path="/account" element={<Account />} />
              <Route path="/vault" element={<Vault />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </Web3ContextProvider>
  );
}

export default App;
