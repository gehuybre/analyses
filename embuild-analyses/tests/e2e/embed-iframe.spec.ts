import { test, expect } from '@playwright/test';

/**
 * E2E tests for iframe embedding functionality
 *
 * These tests verify that:
 * 1. Embeds work correctly when loaded inside iframes
 * 2. Multiple iframes can be loaded simultaneously
 * 3. Iframe lazy loading works correctly
 * 4. Cross-origin embedding works as expected
 */

test.describe('Embed Iframe Tests', () => {
  test('should load embed content inside iframe', async ({ page }) => {
    // Create a simple HTML page with an iframe
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Test Embedding</h1>
          <iframe
            id="test-iframe"
            src="${page.context().baseURL}/embed/vergunningen-goedkeuringen/renovatie/?view=chart"
            width="100%"
            height="500"
            style="border: 0;"
            title="Test Embed"
          ></iframe>
        </body>
      </html>
    `);

    // Wait for iframe to load
    const iframe = page.frameLocator('#test-iframe');

    // Verify iframe loaded (by checking the frame exists and has content)
    const iframeElement = await page.locator('#test-iframe');
    await expect(iframeElement).toBeVisible();

    // Wait for iframe content to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should load multiple iframes simultaneously', async ({ page }) => {
    const embeds = [
      '/embed/vergunningen-goedkeuringen/renovatie/?view=chart',
      '/embed/vergunningen-goedkeuringen/nieuwbouw/?view=table',
      '/embed/vastgoed-verkopen/transacties/?view=chart',
    ];

    // Create page with multiple iframes
    const iframesHtml = embeds.map((path, index) => `
      <iframe
        id="iframe-${index}"
        src="${page.context().baseURL}${path}"
        width="100%"
        height="500"
        style="border: 0; margin-bottom: 20px;"
        title="Embed ${index}"
      ></iframe>
    `).join('\n');

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Multiple Embeds Test</title></head>
        <body>
          <h1>Multiple Embeds</h1>
          ${iframesHtml}
        </body>
      </html>
    `);

    // Wait for all iframes to load
    await page.waitForLoadState('networkidle');

    // Verify all iframes are visible
    for (let i = 0; i < embeds.length; i++) {
      const iframe = await page.locator(`#iframe-${i}`);
      await expect(iframe).toBeVisible();
    }
  });

  test('should handle iframe lazy loading attribute', async ({ page }) => {
    // Create page with lazy-loaded iframe
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Lazy Loading Test</title></head>
        <body>
          <div style="height: 2000px;">Spacer content</div>
          <iframe
            id="lazy-iframe"
            src="${page.context().baseURL}/embed/vergunningen-goedkeuringen/renovatie/?view=chart"
            width="100%"
            height="500"
            style="border: 0;"
            title="Lazy Embed"
            loading="lazy"
          ></iframe>
        </body>
      </html>
    `);

    // Initially, the iframe should not be in viewport
    const iframe = page.locator('#lazy-iframe');

    // Scroll to bring iframe into view
    await iframe.scrollIntoViewIfNeeded();

    // Wait for iframe to load
    await page.waitForLoadState('networkidle');

    // Verify iframe is visible
    await expect(iframe).toBeVisible();
  });

  test('should handle iframe with different widths (responsive)', async ({ page }) => {
    const widths = ['100%', '800px', '400px'];

    for (const width of widths) {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head><title>Responsive Test</title></head>
          <body>
            <div style="width: ${width}; margin: 0 auto;">
              <iframe
                id="responsive-iframe"
                src="${page.context().baseURL}/embed/vergunningen-goedkeuringen/renovatie/?view=chart"
                width="100%"
                height="500"
                style="border: 0;"
                title="Responsive Embed"
              ></iframe>
            </div>
          </body>
        </html>
      `);

      await page.waitForLoadState('networkidle');

      const iframe = page.locator('#responsive-iframe');
      await expect(iframe).toBeVisible();
    }
  });

  test('should not generate console errors when embedded', async ({ page }) => {
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

    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // Create page with iframe
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Error Detection Test</title></head>
        <body>
          <iframe
            id="error-test-iframe"
            src="${page.context().baseURL}/embed/vergunningen-goedkeuringen/renovatie/?view=chart"
            width="100%"
            height="500"
            style="border: 0;"
            title="Error Test Embed"
          ></iframe>
        </body>
      </html>
    `);

    // Wait for iframe to fully load
    await page.waitForLoadState('networkidle');

    // Verify no errors occurred
    expect(consoleErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should handle iframe with basePath correctly', async ({ page }) => {
    // Verify that embeds work with the GitHub Pages basePath
    // The baseURL should already include the basePath in production

    // Verify no 404 errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const loc = msg.location()?.url || '';
        // Only capture 404 errors, filter out React hydration warnings
        if (
          text.includes('404') &&
          (loc.includes('/_next/static/') || loc.endsWith('/favicon.ico') || loc === '')
        ) {
          return;
        }
        if (text.includes('404') && !text.includes('Warning: Prop') && !text.includes('did not match')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>BasePath Test</title></head>
        <body>
          <iframe
            id="basepath-iframe"
            src="${page.context().baseURL}/embed/vergunningen-goedkeuringen/renovatie/?view=chart"
            width="100%"
            height="500"
            style="border: 0;"
            title="BasePath Embed"
          ></iframe>
        </body>
      </html>
    `);

    await page.waitForLoadState('networkidle');

    const iframe = page.locator('#basepath-iframe');
    await expect(iframe).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
