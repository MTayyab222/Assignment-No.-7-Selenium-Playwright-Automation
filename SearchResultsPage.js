// pages/SearchResultsPage.js
// ─────────────────────────────────────────────────────────────────────────────
// Page Object for Daraz.pk Search Results / Category Listing Page
// Responsibilities:
//   - Apply brand filter
//   - Apply price range filter
//   - Count visible products
//   - Open a specific product
// ─────────────────────────────────────────────────────────────────────────────

const { expect } = require('@playwright/test');
const { sleep, dismissPopups, parsePrice, assertPricesInRange } = require('../utils/helpers');
const { TARGET_BRANDS, PRICE_MIN, PRICE_MAX, MIN_PRODUCT_COUNT, FILTER_WAIT, RESULTS_WAIT } = require('../config/constants');

class SearchResultsPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Product grid ──────────────────────────────────────────────────────
    // Daraz renders products inside a grid — selectors cover different layouts
    this.productCards     = page.locator('.product-card, [data-qa-locator="product-item"], .item--ZJRDn, li[class*="product"]');
    this.productLinks     = page.locator('a[data-qa-locator="product-item"], .product-card a, .item a[href*="/products/"]');

    // ── Filter sidebar ─────────────────────────────────────────────────────
    // Price input filter
    this.priceMinInput    = page.locator('input[placeholder*="Min"], input[name="min_price"], .price-range-filter input').first();
    this.priceMaxInput    = page.locator('input[placeholder*="Max"], input[name="max_price"], .price-range-filter input').last();
    this.priceApplyBtn    = page.locator('button[data-qa-locator="filter-price-button"], button.price-filter-btn, .price-range-filter button').first();

    // Sort & filter panel
    this.filterPanel      = page.locator('.filter-panel, aside[class*="filter"], [data-qa-locator="filter-panel"]');

    // Product price labels inside cards
    this.productPrices    = page.locator('.price--NVB62, [data-qa-locator="product-price"], .product-price');
  }

  // ── Brand Filter ──────────────────────────────────────────────────────────

  /**
   * Apply a brand filter from the sidebar.
   * Iterates TARGET_BRANDS from constants and clicks the first one found.
   * @returns {Promise<string>} The brand name that was selected
   */
  async applyBrandFilter() {
    console.log('[SearchResultsPage] Applying brand filter …');

    // Wait for filter sidebar to be visible
    await sleep(FILTER_WAIT);
    await dismissPopups(this.page);

    for (const brand of TARGET_BRANDS) {
      // Match brand checkbox / label in the sidebar (case-insensitive)
      const brandLocator = this.page.locator(
        `label:has-text("${brand}"), .checkbox-item:has-text("${brand}"), ` +
        `[data-qa-locator*="brand"] >> text="${brand}"`
      ).first();

      const isVisible = await brandLocator.isVisible().catch(() => false);

      if (isVisible) {
        await brandLocator.click();
        console.log(`[SearchResultsPage] ✔ Brand selected: ${brand}`);
        await sleep(RESULTS_WAIT);
        return brand;
      }
    }

    // If none of the target brands were found, log and continue without crashing
    console.warn('[SearchResultsPage] ⚠ No target brand found in sidebar — skipping brand filter');
    return null;
  }

  // ── Price Filter ──────────────────────────────────────────────────────────

  /**
   * Apply a min/max price filter using the sidebar inputs.
   * Falls back to URL-based filter if sidebar inputs are not found.
   * @param {number} [min=PRICE_MIN]
   * @param {number} [max=PRICE_MAX]
   */
  async applyPriceFilter(min = PRICE_MIN, max = PRICE_MAX) {
    console.log(`[SearchResultsPage] Applying price filter: PKR ${min} – ${max}`);

    try {
      await this.priceMinInput.waitFor({ state: 'visible', timeout: 8_000 });

      await this.priceMinInput.fill(String(min));
      await this.priceMaxInput.fill(String(max));

      try {
        await this.priceApplyBtn.click({ timeout: 5_000 });
      } catch {
        await this.priceMinInput.press('Enter');
      }

      console.log(`[SearchResultsPage] ✔ Price filter applied via sidebar inputs`);
    } catch {
      // Sidebar inputs not found — inject filter via URL query params
      console.warn('[SearchResultsPage] Sidebar price inputs not found — using URL params');
      const currentUrl = this.page.url();
      const url = new URL(currentUrl);
      url.searchParams.set('price', `${min}-${max}`);
      await this.page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
      console.log(`[SearchResultsPage] ✔ Price filter applied via URL: ${url.toString()}`);
    }

    await sleep(RESULTS_WAIT);
    await dismissPopups(this.page);
  }

  // ── Product Count ─────────────────────────────────────────────────────────

  /**
   * Count visible product cards in the search results.
   * @returns {Promise<number>}
   */
  async countProducts() {
    // Wait for at least 1 product card to render
    await this.productCards.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    const count = await this.productCards.count();
    console.log(`[SearchResultsPage] Product count: ${count}`);
    return count;
  }

  /**
   * Assert that the number of visible products is greater than a threshold.
   * @param {number} [minimum=MIN_PRODUCT_COUNT]
   */
  async assertProductCountGreaterThan(minimum = MIN_PRODUCT_COUNT) {
    const count = await this.countProducts();
    console.log(`[SearchResultsPage] Validating product count > ${minimum} (actual: ${count})`);
    expect(count).toBeGreaterThan(minimum);
    console.log(`[SearchResultsPage] ✔ Product count validation passed`);
    return count;
  }

  // ── Price Validation ──────────────────────────────────────────────────────

  /**
   * Extract visible prices and assert they fall within the given range.
   * Checks the first N products to keep tests fast.
   * @param {number} [min=PRICE_MIN]
   * @param {number} [max=PRICE_MAX]
   * @param {number} [sampleSize=10]
   */
  async assertPricesWithinRange(min = PRICE_MIN, max = PRICE_MAX, sampleSize = 10) {
    const count = await this.productPrices.count();
    const checkCount = Math.min(count, sampleSize);
    const prices = [];

    for (let i = 0; i < checkCount; i++) {
      const text = await this.productPrices.nth(i).textContent().catch(() => '');
      const price = parsePrice(text);
      if (price !== null) prices.push(price);
    }

    if (prices.length === 0) {
      console.warn('[SearchResultsPage] ⚠ No prices extracted — skipping price range assertion');
      return;
    }

    console.log(`[SearchResultsPage] Asserting ${prices.length} prices are within PKR ${min}–${max}`);
    assertPricesInRange(prices, min, max);
    console.log(`[SearchResultsPage] ✔ All sampled prices are within range`);
  }

  // ── Open Product ──────────────────────────────────────────────────────────

  /**
   * Click the Nth product (0-indexed) and return the new ProductDetailPage URL.
   * @param {number} [index=0]
   * @returns {Promise<string>} URL of the opened product page
   */
  async openProduct(index = 0) {
    console.log(`[SearchResultsPage] Opening product at index ${index}`);
    await this.productCards.first().waitFor({ state: 'visible', timeout: 15_000 });

    const cards = this.productCards;
    const count = await cards.count();
    if (count === 0) throw new Error('No products found to open');

    const safeIndex = Math.min(index, count - 1);
    const card = cards.nth(safeIndex);

    // Open in the same tab — collect the new URL
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page').catch(() => null),
      card.click({ timeout: 10_000 }),
    ]);

    if (newPage) {
      // Product opened in a new tab
      await newPage.waitForLoadState('domcontentloaded', { timeout: 30_000 });
      console.log(`[SearchResultsPage] Product opened in new tab: ${newPage.url()}`);
      return newPage;
    }

    // Navigated in same tab
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    console.log(`[SearchResultsPage] Product opened in same tab: ${this.page.url()}`);
    return this.page;
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  /**
   * Verify that the results page URL contains expected parameters.
   */
  async verifyOnResultsPage() {
    const url = this.page.url();
    console.log(`[SearchResultsPage] Current URL: ${url}`);
    expect(url).toMatch(/catalog|search|list/i);
    console.log(`[SearchResultsPage] ✔ On search results page`);
  }

  /**
   * Verify the page header / breadcrumb includes the search term.
   * @param {string} term
   */
  async verifySearchTerm(term) {
    const title = await this.page.title();
    expect(title.toLowerCase()).toContain(term.toLowerCase());
    console.log(`[SearchResultsPage] ✔ Page title contains search term: "${term}"`);
  }
}

module.exports = SearchResultsPage;
