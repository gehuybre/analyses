# Testing Guide

This directory contains automated tests for the Data Blog project.

## E2E Tests (Playwright)

The `e2e/` directory contains end-to-end tests that verify the embed functionality works correctly.

### Test Coverage

1. **Embed Loading Tests** (`embed-loading.spec.ts`)
   - Verifies all embed iframes load successfully without errors
   - Checks that no console errors are generated during load
   - Tests responsive behavior across different viewport sizes
   - Validates timeout handling

2. **Embed Filter Tests** (`embed-filters.spec.ts`)
   - Tests geographic filters (region, province, municipality)
   - Validates view switching (chart, table, map)
   - Tests sector, horizon, and type filters
   - Verifies multiple filters work together
   - Ensures graceful handling of invalid filter values

3. **Embed Iframe Tests** (`embed-iframe.spec.ts`)
   - Tests embeds when loaded inside iframes (simulating external sites)
   - Verifies multiple iframes can load simultaneously
   - Tests iframe lazy loading functionality
   - Validates responsive iframe behavior
   - Ensures no cross-origin errors occur

### Running Tests Locally

#### Prerequisites

```bash
cd embuild-analyses
npm install
npx playwright install
```

#### Run All Tests

```bash
npm test
```

#### Run Tests in UI Mode (Interactive)

```bash
npm run test:ui
```

This opens the Playwright UI where you can:
- See all tests and their status
- Run individual tests
- Debug tests step-by-step
- See screenshots and traces

#### Run Tests in Headed Mode (See Browser)

```bash
npm run test:headed
```

#### Run Specific Test File

```bash
npx playwright test embed-loading.spec.ts
```

#### Run Tests for Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### View Test Report

After running tests, view the HTML report:

```bash
npm run test:report
```

### Debugging Tests

1. **Use the UI mode** for interactive debugging:
   ```bash
   npm run test:ui
   ```

2. **Add `--debug` flag** to run with Playwright Inspector:
   ```bash
   npx playwright test --debug
   ```

3. **Add breakpoints** in test code:
   ```typescript
   await page.pause(); // Pauses test execution
   ```

4. **View traces** after test failure:
   ```bash
   npx playwright show-trace trace.zip
   ```

### CI/CD Integration

Tests automatically run in GitHub Actions on:
- Pull requests to `main` branch
- Pushes to `main` branch
- Manual workflow dispatch

See `.github/workflows/playwright-tests.yml` for the CI configuration.

### Writing New Tests

1. Create a new test file in `tests/e2e/`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test('my new test', async ({ page }) => {
     await page.goto('embed/my-analysis/my-metric/?view=chart');
     // Add assertions
   });
   ```

2. Follow existing test patterns for consistency

3. Run your new tests locally before committing:
   ```bash
   npm test
   ```

### Test Configuration

The Playwright configuration is in `playwright.config.ts`. It includes:
- Base URL configuration (defaults to `http://localhost:3000`)
- Browser configurations (Chromium, Firefox, WebKit)
- Mobile device emulation (Pixel 5, iPhone 12)
- Automatic dev server startup
- Screenshot and trace capture on failure
- GitHub Actions reporter for CI

### Environment Variables

- `BASE_URL`: Override the base URL for tests (default: `http://localhost:3000`)
  ```bash
  BASE_URL=https://gehuybre.github.io/data-blog npm test
  ```

- `CI`: Set automatically in GitHub Actions to enable CI-specific settings

### Best Practices

1. **Keep tests independent**: Each test should be able to run in isolation
2. **Use appropriate waits**: Prefer `waitForLoadState('networkidle')` over arbitrary timeouts
3. **Capture errors**: Always listen for console and page errors
4. **Test multiple browsers**: Run tests across Chromium, Firefox, and WebKit
5. **Test mobile viewports**: Ensure embeds work on mobile devices
6. **Keep tests fast**: Avoid unnecessary waits and operations
7. **Use meaningful assertions**: Verify actual functionality, not just page load

### Troubleshooting

#### Tests fail locally but pass in CI
- Check if you have the latest browsers installed: `npx playwright install`
- Verify your local dev server is running correctly
- Check for environment-specific issues (file paths, etc.)

#### Tests timeout
- Increase timeout in `playwright.config.ts` if needed
- Check if the dev server is starting correctly
- Verify network connectivity

#### Flaky tests
- Add more robust waiting strategies
- Use `waitForLoadState()` instead of `waitForTimeout()`
- Check for race conditions

#### Browser not found
- Run `npx playwright install` to install browsers
- On CI, the workflow includes `--with-deps` flag for system dependencies

## Manual Tests

The `manual/` directory contains HTML pages for manual testing:
- `embed-test.html`: Manual test page for visual verification of embeds

While automated tests are preferred, manual tests can be useful for:
- Visual regression testing
- Interactive feature exploration
- Cross-browser compatibility checks
