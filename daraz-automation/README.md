# Daraz.pk Playwright Automation — Assignment No. 7

> **Functional test automation for Daraz.pk using Playwright + Page Object Model (POM)**

---

## 📁 Project Structure

```
daraz-automation/
│
├── config/
│   └── constants.js          # Search term, price range, brand list, timeouts
│
├── pages/                    # Page Object Model classes
│   ├── HomePage.js           # Home page: navigation + search
│   ├── SearchResultsPage.js  # Results page: filters + product count + open product
│   └── ProductDetailPage.js  # Product page: details + free shipping check
│
├── tests/
│   └── daraz.spec.js         # All test suites (Tasks 1–8 + edge cases)
│
├── utils/
│   └── helpers.js            # Shared utilities: sleep, popups, price parsing
│
├── playwright.config.js      # Playwright configuration
├── package.json
└── README.md
```

---

## ✅ Tasks Covered

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Setup project with Playwright + POM | `playwright.config.js`, `pages/` | ✅ |
| 2 | Navigate to Daraz.pk | `HomePage.goto()` | ✅ |
| 3 | Search for "electronics" | `HomePage.searchFor()` | ✅ |
| 4 | Apply brand filter | `SearchResultsPage.applyBrandFilter()` | ✅ |
| 5 | Apply price filter (PKR 500–5000) | `SearchResultsPage.applyPriceFilter()` | ✅ |
| 6 | Count products & validate > 0 | `SearchResultsPage.assertProductCountGreaterThan()` | ✅ |
| 7 | Open product details | `SearchResultsPage.openProduct()` | ✅ |
| 8 | Verify free shipping | `ProductDetailPage.softCheckFreeShipping()` | ✅ |

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** ≥ 16
- **npm** ≥ 7

### Install dependencies

```bash
npm install
npx playwright install chromium
```

---

## ▶️ Running Tests

```bash
# Run all tests (headless)
npm test

# Run all tests with browser visible
npm run test:headed

# Run a single test file
npx playwright test tests/daraz.spec.js

# Run with debug mode (step-through)
npm run test:debug

# Open HTML report after a test run
npm run test:report
```

---

## 🧪 Test Suites

### 1. Full End-to-End Flow (`Tasks 2–8`)
A single test that runs the complete flow:
Navigate → Search → Brand Filter → Price Filter → Count → Open Product → Check Shipping

### 2. Individual Task Tests
Each task has its own isolated test for targeted debugging and reporting.

### 3. Edge Case / Boundary Tests
- Empty search input handling
- `countProducts()` return type validation
- Price constant boundary verification

---

## 🏗️ Page Object Model Architecture

### `HomePage`
| Method | Description |
|--------|-------------|
| `goto()` | Navigates to daraz.pk, dismisses popups |
| `searchFor(term)` | Fills search box and submits |
| `verifyPageLoaded()` | Asserts title contains "Daraz" |

### `SearchResultsPage`
| Method | Description |
|--------|-------------|
| `applyBrandFilter()` | Clicks first available brand from `TARGET_BRANDS` list |
| `applyPriceFilter(min, max)` | Fills sidebar inputs (falls back to URL params) |
| `countProducts()` | Returns visible product card count |
| `assertProductCountGreaterThan(n)` | Fails test if count ≤ n |
| `assertPricesWithinRange(min, max)` | Spot-checks prices of first 10 products |
| `openProduct(index)` | Clicks a product card, returns the resulting page |
| `verifyOnResultsPage()` | URL pattern assertion |

### `ProductDetailPage`
| Method | Description |
|--------|-------------|
| `waitForPageLoad()` | Waits for DOM + JS, dismisses popups |
| `getProductTitle()` | Returns product title string |
| `getProductPrice()` | Returns numeric price (PKR) |
| `isFreeShippingAvailable()` | Scans shipping widgets + full body text |
| `softCheckFreeShipping()` | Logs result without failing the test |
| `assertFreeShippingAvailable()` | Hard-fails if free shipping is absent |
| `assertProductTitleVisible()` | Title length > 0 |
| `assertProductPriceVisible()` | Price > 0 |
| `verifyOnProductPage()` | URL matches `/products/` or `/i/` |

---

## ⚙️ Configuration

Edit `config/constants.js` to change:

| Constant | Default | Description |
|----------|---------|-------------|
| `SEARCH_TERM` | `"electronics"` | Keyword to search |
| `PRICE_MIN` | `500` | Minimum price (PKR) |
| `PRICE_MAX` | `5000` | Maximum price (PKR) |
| `TARGET_BRANDS` | `['Samsung', 'Xiaomi', ...]` | Brand filter priority list |
| `MIN_PRODUCT_COUNT` | `1` | Minimum expected products |

---

## 🛡️ Resilience Features

- **Popup dismissal** — auto-closes cookie/promo modals before each action
- **Retry on click** — `safeClick()` retries 3× on detached elements
- **Filter fallback** — price filter falls back to URL params if sidebar inputs are missing
- **Brand fallback** — iterates brand list; skips gracefully if none are available
- **Soft assertions** — shipping check logs results without blocking the pipeline

---

## 📊 Reports

After running tests, open the HTML report:

```bash
npx playwright show-report
```

Screenshots and videos for failed tests are saved automatically in `playwright-report/`.

---

## 🔧 Tools & Technologies

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright](https://playwright.dev) | ^1.44.0 | Browser automation framework |
| Node.js | ≥ 16 | Runtime |
| Chromium | Bundled | Test browser |

---

## 📝 Notes

- Daraz.pk uses dynamic, JavaScript-rendered content — all selectors include fallbacks for layout variations.
- Free shipping varies by product and seller; `softCheckFreeShipping()` is used in the main flow to avoid flaky failures.
- Replace with `assertFreeShippingAvailable()` if testing a known product that always has free shipping.
