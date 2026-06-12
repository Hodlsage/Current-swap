/* ============================================================================
 * FILE: src/config/legacyVaultData.js
 * PURPOSE: Fallback data for the Vault reporting page, used when the live
 *          USGold V1 "old vault" wallet balance (Ethereum mainnet, see
 *          useV1VaultBalance.js) is unavailable (e.g. sandboxes without
 *          external network access).
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.1.0  2026-06-12  Initial capture ($100 placeholder Eagle price).
 *   v0.2.0  2026-06-12  Eagle price corrected to $4,750 (rough spot+premium
 *           estimate).
 *   v0.3.0  2026-06-12  Eagle price now sourced from eaglePricing.js, which
 *           implements the verified US Mint Pricing Grid formula
 *           (floor(goldSpot/50)*50 + 870). Current value: $5,420 at
 *           $4,566/oz gold spot (2026-06-12). See eaglePricing.js for the
 *           full sourcing note and the recommended path to a live oracle
 *           feed.
 *   v0.4.0  2026-06-12  certificatesInCustody is now a FALLBACK for
 *           useV1VaultBalance's live read of the V1 "old vault" wallet
 *           (0x08d43cc89A420C7E40c98a8BBb8096828C16Ab85) balance on the
 *           legacy USGold (USG) contract on Ethereum mainnet
 *           (0x4000369AcfA25C8FE5d17fE3312e30C332beF633, 9 decimals). On the
 *           live site, Vault.jsx prefers the real wallet balance; this value
 *           (100) is only shown if that read hasn't returned yet or fails.
 * ==========================================================================*/

import { EAGLE_PRICE_CRNT, CURRENT_GOLD_SPOT_USD, CURRENT_GOLD_SPOT_AS_OF } from './eaglePricing';

export const LEGACY_VAULT_REFERENCE = {
    label: 'Vault custody — fallback snapshot',
    sourceNote:
        `Eagle price computed from the US Mint Pricing Grid formula ` +
        `(floor(goldSpot/50)*50 + $870 premium) at a gold spot of ` +
        `$${CURRENT_GOLD_SPOT_USD.toLocaleString()}/oz (as of ${CURRENT_GOLD_SPOT_AS_OF}).`,

    // Each "certificate" = 1 oz American Gold Eagle. FALLBACK value, used
    // only if the live V1 old-vault wallet balance is unavailable.
    certificatesInCustody: 100,

    // Market price of 1 oz American Gold Eagle (Uncirculated), in whole CRNT
    // (1 CRNT = $1). See eaglePricing.js for derivation.
    eaglePriceCRNT: EAGLE_PRICE_CRNT,

    // Derived: certificatesInCustody * eaglePriceCRNT
    get totalCustodyValueCRNT() {
        return this.certificatesInCustody * this.eaglePriceCRNT;
    },

    asOf: CURRENT_GOLD_SPOT_AS_OF,
};
