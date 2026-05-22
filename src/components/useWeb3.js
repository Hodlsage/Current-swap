/* ============================================================================
 * FILE: src/components/useWeb3.js
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Exposed loginTime + chainId (+ setters) from context.
 *   v0.1.0  Original as cloned.
 * ==========================================================================*/

import { useContext } from "react";
import { web3Context } from "./web3Context";

const useWeb3 = () => useContext(web3Context);

export default useWeb3;
