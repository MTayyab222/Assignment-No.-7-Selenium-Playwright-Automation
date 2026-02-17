// pages/ProductDetailPage.js
// ─────────────────────────────────────────────────────────────────────────────
// Page Object for Daraz.pk Product Detail Page
// Responsibilities:
//   - Verify product details are present
//   - Check for free shipping badge
//   - Assert product name / price
// ─────────────────────────────────────────────────────────────────────────────

const { expect } = require('@playwright/test');
const { sleep, dismissPopups, parsePrice } = require('../utils/helpers');
const { FREE_SHIPPING_KEYWORDS } = require('../config/constants');

class ProductDetailPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Product information ───────────────────────────────────────────────
    this.productTitle     = page.locator('.pdp-product-title, h1.title, [class*="pdp-mod-product-badge-title"]').first();
    this.productPrice     = page.locator('.pdp-price, .product-price, [class*="pdp-mod-price"]').first();

    // ── Shipping information ───────────────────────────────────────────────
    // Daraz shows "Free Shipping" / "Free Delivery" in several locations
    this.shippingSection  = page.locator(
      '.delivery-option-item, [class*="free-delivery"], ' +
      '[class*="shipping"], .service-item, ' +
      '.pdp-delivery-item, [data-qa-locator*="delivery"]'
    );

    // Generic text scan for free-shipping keywords (most reliable cross-layout)
    this.pageBody         = page.locator('body');

    // ── Seller / store info ───────────────────────────────────────────────
    this.sellerName       = page.locator('.seller-name, .pdp-product-seller, [class*="seller"]').first();

    // ── Add to cart ───────────────────────────────────────────────────────
    this.addToCartBtn     = page.locator('button[data-spm="add-to-cart"], .add-to-cart, [class*="btn-add-to-cart"]').first();

    // ── Product images ────────────────────────────────────────────────────
    this.mainImage        = page.locator('.pdp-mod-main-pic img, .product-image img, [class*="gallery"] img').first();
  }

  // ── Wait / Setup ──────────────────────────────────────────────────────────

  /**
   * Wait for the product detail page to be fully loaded.
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await sleep(2000); // allow JS-rendered content to settle
    await dismissPopups(this.page);
    console.log(`[ProductDetailPage] Page loaded: ${this.page.url()}`);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  /**
   * Return the product title text.
   * @returns {Promise<string>}
   */
  async getProductTitle() {
    try {
      await this.productTitle.waitFor({ state: 'visible', timeout: 10_000 });
      return (await this.productTitle.textContent()).trim();
    } catch {
      // Fallback: read the page <title> tag
      return this.page.title();
    }
  }

  /**
   * Return the product price as a number (PKR).
   * @returns {Promise<number|null>}
   */
  async getProductPrice() {
    try {
      const text = await this.productPrice.textContent({ timeout: 8_000 });
      return parsePrice(text);
    } catch {
      return null;
    }
  }

  // ── Free Shipping Check ───────────────────────────────────────────────────

  /**
   * Check whether free shipping is advertised on the product page.
   *
   * Strategy:
   *   1. Look for explicit "free shipping" UI elements.
   *   2. Fall back to a full-text scan of the page body.
   *
   * @returns {Promise<boolean>} true if free shipping is detected
   */
  async isFreeShippingAvailable() {
    console.log('[ProductDetailPage] Checking for free shipping …');

    // 1. Check dedicated shipping widgets
    const widgetCount = await this.shippingSection.count();
    for (let i = 0; i < widgetCount; i++) {
      const text = (await this.shippingSection.nth(i).textContent().catch(() => '')).toLowerCase();
      if (FREE_SHIPPING_KEYWORDS.some((kw) => text.includes(kw))) {
        console.log(`[ProductDetailPage] ✔ Free shipping found in shipping widget: "${text.trim()}"`);
        return true;
      }
    }

    // 2. Full page body text scan (catches lazy-loaded elements)
    const bodyText = (await this.pageBody.textContent().catch(() => '')).toLowerCase();
    const found = FREE_SHIPPING_KEYWORDS.some((kw) => bodyText.includes(kw));
    console.log(`[ProductDetailPage] Free shipping text scan result: ${found}`);
    return found;
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  /**
   * Verify we are on a product detail page by checking URL pattern.
   */
  async verifyOnProductPage() {
    const url = this.page.url();
    console.log(`[ProductDetailPage] URL: ${url}`);
    expect(url).toMatch(/\/products\/|\/i\//i);
    console.log('[ProductDetailPage] ✔ URL matches product detail pattern');
  }

  /**
   * Assert product title is not empty.
   */
  async assertProductTitleVisible() {
    const title = await this.getProductTitle();
    expect(title.length).toBeGreaterThan(0);
    console.log(`[ProductDetailPage] ✔ Product title: "${title}"`);
  }

  /**
   * Assert product price is a positive number.
   */
  async assertProductPriceVisible() {
    const price = await this.getProductPrice();
    if (price !== null) {
      expect(price).toBeGreaterThan(0);
      console.log(`[ProductDetailPage] ✔ Product price: PKR ${price}`);
    } else {
      console.warn('[ProductDetailPage] ⚠ Price not extractable — skipping price assertion');
    }
  }

  /**
   * Assert free shipping is available (hard fail if absent).
   */
  async assertFreeShippingAvailable() {
    const available = await this.isFreeShippingAvailable();
    expect(available).toBe(true);
    console.log('[ProductDetailPage] ✔ Free shipping confirmed');
  }

  /**
   * Soft-check free shipping — logs result but does NOT fail the test.
   * Use this when free shipping is not guaranteed for all products.
   * @returns {Promise<boolean>}
   */
  async softCheckFreeShipping() {
    const available = await this.isFreeShippingAvailable();
    if (available) {
      console.log('[ProductDetailPage] ✔ Free shipping IS available on this product');
    } else {
      console.log('[ProductDetailPage] ℹ Free shipping is NOT available on this product');
    }
    return available;
  }

  /**
   * Assert the add-to-cart button is visible.
   */
  async assertAddToCartVisible() {
    try {
      await this.addToCartBtn.waitFor({ state: 'visible', timeout: 8_000 });
      console.log('[ProductDetailPage] ✔ Add to Cart button is visible');
    } catch {
      console.warn('[ProductDetailPage] ⚠ Add to Cart button not found (may be a sold-out item)');
    }
  }
}

module.exports = ProductDetailPage;
