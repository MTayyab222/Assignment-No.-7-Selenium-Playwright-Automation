// config/constants.js
// ─────────────────────────────────────────────────────────────────────────────
// Central configuration file — edit here to change search terms, price ranges,
// expected brands, and timing values across all tests.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // ── URLs ──────────────────────────────────────────────────────────────────
  BASE_URL: 'https://www.daraz.pk',

  // ── Search ────────────────────────────────────────────────────────────────
  SEARCH_TERM: 'electronics',

  // ── Price filter range (PKR) ───────────────────────────────────────────────
  PRICE_MIN: 500,
  PRICE_MAX: 5000,

  // ── Brand filter ─────────────────────────────────────────────────────────
  // Brands commonly listed under "electronics" on Daraz.pk
  // The automation will try each in order and use the first one found.
  TARGET_BRANDS: ['Samsung', 'Xiaomi', 'Audionic', 'Anker', 'Sony'],

  // ── Validation thresholds ─────────────────────────────────────────────────
  MIN_PRODUCT_COUNT: 1,          // Products must be > 0 after filtering

  // ── Timeouts (ms) ─────────────────────────────────────────────────────────
  DEFAULT_TIMEOUT:      30_000,
  NAVIGATION_TIMEOUT:   40_000,
  FILTER_WAIT:           3_000,  // wait for filter panel to settle
  RESULTS_WAIT:          4_000,  // wait for search results to update

  // ── Text markers (used in assertions) ────────────────────────────────────
  FREE_SHIPPING_KEYWORDS: ['free shipping', 'free delivery', 'free'],
};
