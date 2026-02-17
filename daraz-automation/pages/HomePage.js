// pages/HomePage.js
// ─────────────────────────────────────────────────────────────────────────────
// Page Object for Daraz.pk Home Page
// Responsibilities: navigate to homepage, accept cookies, perform search
// ─────────────────────────────────────────────────────────────────────────────

const { expect } = require('@playwright/test');
const { dismissPopups } = require('../utils/helpers');
const { BASE_URL } = require('../config/constants');

class HomePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Locators ─────────────────────────────────────────────────────────────
    this.searchInput   = page.locator('#q, input[type="search"], .search-box input').first();
    this.searchButton  = page.locator('button[type="submit"], .search-btn, [data-spm="search"]').first();
    this.logo          = page.locator('.logo, #logo, a[aria-label="Daraz"]').first();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Navigate to the Daraz homepage and wait until it is fully loaded.
   */
  async goto() {
    console.log(`[HomePage] Navigating to ${BASE_URL}`);
    await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 40_000 });

    // Let any redirect / JS boot finish
    await this.page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // Dismiss any cookie/promo banners
    await dismissPopups(this.page);

    console.log('[HomePage] Page loaded');
  }

  /**
   * Type a search term and submit via the search button (or Enter key).
   * @param {string} term - Search keyword (e.g. "electronics")
   */
  async searchFor(term) {
    console.log(`[HomePage] Searching for: "${term}"`);

    // Wait for search box to be interactive
    await this.searchInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.searchInput.fill(term);

    // Try clicking the search button; fall back to pressing Enter
    try {
      await this.searchButton.click({ timeout: 5000 });
    } catch {
      await this.searchInput.press('Enter');
    }

    // Wait for navigation to the search results page
    await this.page.waitForURL(/\/catalog\/\?q=|search/, { timeout: 30_000 });
    console.log('[HomePage] Search submitted — on results page');
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  /**
   * Verify the page title contains "Daraz".
   */
  async verifyPageLoaded() {
    await expect(this.page).toHaveTitle(/Daraz/i, { timeout: 15_000 });
    console.log('[HomePage] ✔ Page title verified');
  }
}

module.exports = HomePage;
