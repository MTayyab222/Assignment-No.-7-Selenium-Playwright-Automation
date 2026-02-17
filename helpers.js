// utils/helpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Reusable helper functions used across Page Objects and test suites.
// ─────────────────────────────────────────────────────────────────────────────

const { expect } = require('@playwright/test');

/**
 * Wait for a fixed number of milliseconds.
 * Use sparingly — prefer waitFor* selectors where possible.
 * @param {number} ms
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dismiss a cookie consent / promotional popup if one appears within `timeout` ms.
 * Silently continues if no popup is found.
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeout=4000]
 */
async function dismissPopups(page, timeout = 4000) {
  const closeSelectors = [
    '[data-spm="close"]',
    '.close-btn',
    '.lazyload-wrapper .close',
    '.next-dialog-close',
    'button[aria-label="Close"]',
    '.mod-close',
    '.popup-close',
  ];

  for (const selector of closeSelectors) {
    try {
      const btn = page.locator(selector).first();
      await btn.waitFor({ state: 'visible', timeout: timeout / closeSelectors.length });
      await btn.click();
      console.log(`[Popup] Dismissed popup: ${selector}`);
      return;
    } catch {
      // no popup with this selector — try next
    }
  }
}

/**
 * Scroll to the bottom of the page gradually.
 * Useful for triggering lazy-loaded elements.
 * @param {import('@playwright/test').Page} page
 * @param {number} [steps=5]
 */
async function scrollToBottom(page, steps = 5) {
  const delta = Math.round((await page.evaluate(() => document.body.scrollHeight)) / steps);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), delta * i);
    await sleep(300);
  }
}

/**
 * Safely click an element, retrying on "detached" errors.
 * @param {import('@playwright/test').Locator} locator
 * @param {number} [retries=3]
 */
async function safeClick(locator, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await locator.click({ timeout: 8000 });
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1000);
    }
  }
}

/**
 * Extract a numeric price from a text string like "PKR 1,299" → 1299.
 * @param {string} text
 * @returns {number|null}
 */
function parsePrice(text) {
  const match = text.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

/**
 * Assert that an array of prices all fall within [min, max].
 * Logs each price for traceability.
 * @param {number[]} prices
 * @param {number} min
 * @param {number} max
 */
function assertPricesInRange(prices, min, max) {
  prices.forEach((price, idx) => {
    console.log(`[Price Check] Product ${idx + 1}: PKR ${price}`);
    expect(price).toBeGreaterThanOrEqual(min);
    expect(price).toBeLessThanOrEqual(max);
  });
}

module.exports = {
  sleep,
  dismissPopups,
  scrollToBottom,
  safeClick,
  parsePrice,
  assertPricesInRange,
};
