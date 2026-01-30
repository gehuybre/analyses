import { test, expect } from '@playwright/test';

/**
 * E2E tests for embed filter functionality
 *
 * These tests verify that:
 * 1. Geographic filters (region, province, municipality) work correctly
 * 2. View switching (chart, table, map) works correctly
 * 3. Other filters (sector, type, horizon) work correctly
 * 4. Filter interactions don't cause console errors
 */

test.describe('Embed Filter Tests', () => {
  test('should handle geographic filter parameter (geo)', async ({ page }) => {
    // Verify no console errors (filter out React hydration warnings)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const loc = msg.location()?.url || '';
        // Filter out React hydration warnings - these are dev-mode only and don't affect functionality
        // Also filter out transient 404s for _next assets during initial dev compilation.
        if (
          (text.includes('Failed to load resource') || text.includes('404 (Not Found)')) &&
          (loc.includes('/_next/static/') || loc.endsWith('/favicon.ico') || loc === '')
        ) {
          return;
        }
        if (!text.includes('Warning: Prop') && !text.includes('did not match')) {
          consoleErrors.push(text);
        }
      }
    });

    // Navigate to embed with geo filter
    const response = await page.goto('embed/vastgoed-verkopen/transacties/?view=chart&geo=2000');
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle view switching parameter', async ({ page }) => {
    const views = ['chart', 'table', 'map'];

    for (const view of views) {
      const response = await page.goto(`embed/vergunningen-goedkeuringen/renovatie/?view=${view}`);
      expect(response?.status()).toBe(200);

      await page.waitForLoadState('networkidle');

      // Verify content is rendered by checking for specific elements
      const body = page.locator('body');
      await expect(body).toBeVisible();
      await expect(body).not.toBeEmpty();
    }
  });

  test('should handle sector filter parameter', async ({ page }) => {
    // Verify no errors (filter out React hydration warnings)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const loc = msg.location()?.url || '';
        // Filter out React hydration warnings - these are dev-mode only and don't affect functionality
        // Also filter out transient 404s for _next assets during initial dev compilation.
        if (
          (text.includes('Failed to load resource') || text.includes('404 (Not Found)')) &&
          (loc.includes('/_next/static/') || loc.endsWith('/favicon.ico') || loc === '')
        ) {
          return;
        }
        if (!text.includes('Warning: Prop') && !text.includes('did not match')) {
          consoleErrors.push(text);
        }
      }
    });

    // Test with construction sector (F)
    const response = await page.goto('embed/starters-stoppers/survival/?view=chart&sector=F');
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle horizon filter parameter', async ({ page }) => {
    // Test with different horizon values
    const horizons = ['3', '2033'];

    for (const horizon of horizons) {
      const response = await page.goto(`embed/starters-stoppers/survival/?view=chart&horizon=${horizon}`);
      expect(response?.status()).toBe(200);

      await page.waitForLoadState('networkidle');

      // Verify content loads by checking for specific elements
      const body = page.locator('body');
      await expect(body).toBeVisible();
      await expect(body).not.toBeEmpty();
    }
  });

  test('should handle type filter parameter', async ({ page }) => {
    // Test with property type filter
    const response = await page.goto('embed/vastgoed-verkopen/transacties/?view=chart&type=huizen_4plus');
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
    await expect(body).not.toBeEmpty();
  });

  test('should handle multiple filters combined', async ({ page }) => {
    // Verify no console errors with multiple filters (filter out React hydration warnings)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const loc = msg.location()?.url || '';
        // Filter out React hydration warnings - these are dev-mode only and don't affect functionality
        // Also filter out transient 404s for _next assets during initial dev compilation.
        if (
          (text.includes('Failed to load resource') || text.includes('404 (Not Found)')) &&
          (loc.includes('/_next/static/') || loc.endsWith('/favicon.ico') || loc === '')
        ) {
          return;
        }
        if (!text.includes('Warning: Prop') && !text.includes('did not match')) {
          consoleErrors.push(text);
        }
      }
    });

    // Test with multiple filters at once
    const response = await page.goto('embed/vastgoed-verkopen/transacties/?view=chart&geo=2000&type=huizen_4plus');
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle invalid filter values gracefully', async ({ page }) => {
    // Test with an invalid geo value - should not crash
    const response = await page.goto('embed/vastgoed-verkopen/transacties/?view=chart&geo=99999');

    // Should still return 200 (page loads, just might show "no data")
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    // Page should still render (even if showing no data message)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle missing required view parameter', async ({ page }) => {
    // Test without view parameter - should have a default behavior
    const response = await page.goto('embed/vergunningen-goedkeuringen/renovatie/');

    // Should still load (with default view)
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
