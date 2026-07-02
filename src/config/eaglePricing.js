/* ============================================================================
 * FILE: src/config/eaglePricing.js
 * PURPOSE: Compute the "Eagle price" (1 oz American Gold Eagle, Uncirculated)
 *          using the real US Mint Numismatic Precious Metals Pricing Grid
 *          formula, derived from gold spot price.
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v1.0.0  2026-06-12  Initial version. Replaces prior $100 and $4,750
 *           placeholders with a formula derived from the US Mint's official
 *           2026 Pricing Grid (Federal Register notice 2026-03952,
 *           https://www.usmint.gov/content/dam/usmint/shop/Pricing-Grid.pdf).
 *   v1.1.0  2026-07-02  Updated CURRENT_GOLD_SPOT_USD to current spot price 
 *           ($4,076) and CURRENT_GOLD_SPOT_AS_OF to 2026-07-02.
 * ----------------------------------------------------------------------------
 * HOW THE US MINT ACTUALLY PRICES THIS (READ THIS FIRST)
 *   - The Mint publishes a "Pricing Grid": for each $50 band of LBMA gold
 *     spot price ($X.00 to $X+49.99), every numismatic gold product has a
 *     fixed price. The grid is re-evaluated every Wednesday based on the
 *     LBMA weekly average gold price and updated via Federal Register notice
 *     when bands change (https://www.federalregister.gov, search "United
 *     States Mint Precious Metal Products").
 *   - For "American Eagle 1 oz Gold Uncirculated" specifically, every row of
 *     the 2026 grid follows ONE formula:
 *         EaglePrice = floor(goldSpot / 50) * 50 + 870
 *     i.e. round gold spot DOWN to the nearest $50, then add an $870
 *     premium. This was verified against the full published grid (bands
 *     from $2,000 to $10,050/oz gold, all consistent with +870).
 *   - This is NOT a government API — it's a downloadable PDF, manually
 *     republished. There is no live JSON/REST endpoint.
 * ----------------------------------------------------------------------------
 * "AS AUTOMATIC AS POSSIBLE" — RECOMMENDED PRODUCTION PATH
 *   1. LIVE GOLD SPOT: use a real price oracle, not a PDF scrape. Chainlink
 *      publishes an XAU/USD price feed on Polygon mainnet
 *      (aggregator address: 0x0C466540B2ee1a31b441671eac0ca886e051E410 as of
 *      writing — VERIFY at https://data.chain.link before using; addresses
 *      can change). This updates continuously and is the right input for
 *      goldSpotToEaglePrice() below.
 *   2. APPLY THE FORMULA: feed that spot price into goldSpotToEaglePrice()
 *      to get the Mint-grid-equivalent Eagle price.
 *   3. PUSH ON-CHAIN: an off-chain job (cron / Chainlink Automation / Chainlink
 *      Functions) calls USGoldVault.setEaglePrice(eaglePriceCRNT) on a
 *      schedule (e.g. weekly, matching the Mint's Wednesday cadence, or more
 *      often — the contract's maxPriceChangeBps guard limits how much any
 *      single update can move the price).
 *   4. SANITY-CHECK AGAINST THE PDF: periodically (e.g. monthly) confirm the
 *      +870 premium constant still matches the published grid — the Mint
 *      can and does change the premium between years (it changed from
 *      smaller offsets in earlier years' grids).
 * ----------------------------------------------------------------------------
 * THIS FILE'S ROLE (frontend-only, no Vault deployed yet)
 *   Provides a snapshot Eagle price for the Vault custody report, computed
 *   from a manually-set CURRENT_GOLD_SPOT (updated periodically by a human
 *   until the oracle pipeline above exists).
 * ==========================================================================*/

// US Mint grid premium for "American Eagle 1 oz Gold Uncirculated", verified
// against the full 2026 grid (constant across all published bands).
export const EAGLE_PREMIUM_USD = 870;

// Mint grid bands are $50 wide; price is keyed to the FLOOR of the band.
export const GRID_BAND_WIDTH = 50;

/**
 * Convert a gold spot price (USD/oz) to the Mint-grid Eagle price (USD),
 * using the verified formula: floor(spot / 50) * 50 + 870.
 * @param {number} goldSpotUsd
 * @returns {number} whole-dollar Eagle price
 */
export function goldSpotToEaglePrice(goldSpotUsd) {
    const band = Math.floor(goldSpotUsd / GRID_BAND_WIDTH) * GRID_BAND_WIDTH;
    return band + EAGLE_PREMIUM_USD;
}

// ---------------------------------------------------------------------------
// SNAPSHOT INPUT — update this periodically (manual until an oracle feed is
// wired up per the production path above). Source: LBMA gold spot, sampled
// 2026-07-02 (~$4,076/oz).
// ---------------------------------------------------------------------------
// UPDATE: Setting the spot price to the current 2026-07-02 real-world value
export const CURRENT_GOLD_SPOT_USD = 4076;
export const CURRENT_GOLD_SPOT_AS_OF = '2026-07-02';

// Derived Eagle price in whole CRNT (1 CRNT = $1 USD, atomic token).
// UPDATE: The new math is now $4,076 -> band $4,050 -> + $870 premium = $4,920.
export const EAGLE_PRICE_CRNT = goldSpotToEaglePrice(CURRENT_GOLD_SPOT_USD);