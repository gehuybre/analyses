# Testing Guide

## Playwright E2E Tests (Currently Implemented)

This project uses Playwright to test embed functionality across multiple browsers.

### Test Environments

#### Local Development
```bash
npm test
```
- Runs against: `http://localhost:3000` (no basePath)
- Starts dev server automatically
- Fast feedback loop for development

#### Production Build (Local)
```bash
./test-production.sh
```
- Runs against: `http://localhost:3000/data-blog` (with basePath)
- Tests the actual production build
- Simulates GitHub Pages environment
- **Run this before pushing to verify production compatibility**

#### CI/CD (GitHub Actions)
Automatically runs on:
- Pull requests to `main`
- Pushes to `main`
- Manual workflow dispatch

CI configuration:
- Builds with `NODE_ENV=production` (includes `/data-blog` basePath)
- Serves static output using `serve`
- Tests against `http://localhost:3000/data-blog`
- Runs on all 5 browser configurations

### Browser Coverage

Tests run on:
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

Total: 115 tests (23 tests × 5 browsers)

### Test Structure

```
tests/e2e/
├── embed-filters.spec.ts     # Tests filter parameters (geo, sector, type, etc.)
├── embed-iframe.spec.ts       # Tests iframe embedding functionality
└── embed-loading.spec.ts      # Tests embed loading and error handling
```

### What's Tested

1. **Filter Parameters**: Geographic filters, sector filters, type filters, horizon filters
2. **View Switching**: Chart, table, and map views
3. **Iframe Embedding**: Single and multiple iframes, lazy loading, responsive behavior
4. **Error Handling**: Invalid parameters, missing parameters, console errors
5. **Base Path**: Correct URL generation with GitHub Pages `/data-blog` prefix

### Key Testing Decisions

#### Hydration Warnings
React hydration warnings (e.g., `href` or `className` mismatches) are **filtered out** in tests because:
- They only occur in development mode
- They don't affect functionality
- They're caused by legitimate SSR/CSR differences (e.g., Tailwind CSS dynamic classes)

The fix applied:
```tsx
<a
  href={typeof window !== "undefined" ? window.location.origin + "/data-blog" : "#"}
  suppressHydrationWarning
>
```

#### Production Base Path
The CI tests verify the production build with the `/data-blog` base path to ensure:
- Embeds work correctly on GitHub Pages
- Asset loading works with the prefix
- Internal links use the correct base path

### Adding New Tests

When adding embeds, update the test data:

```typescript
// tests/e2e/embed-loading.spec.ts
const testEmbeds = [
  {
    path: '/embed/your-analysis/your-section/?view=chart',
    name: 'Your Section Name',
    title: 'Section Title',
  },
  // ...
];
```

### Troubleshooting

#### Tests pass locally but fail in CI
- Run `./test-production.sh` to test the production build locally
- Check if the issue is related to the `/data-blog` base path
- Verify assets load correctly with the base path

#### Hydration warnings
If you see new hydration warnings:
1. Check if they're legitimate (affecting functionality)
2. If dev-only, add filter in test console error handler
3. If real issue, fix the component SSR/CSR mismatch

#### Timeout errors
- Increase timeout in `playwright.config.ts` if needed
- Check if data files are missing (CI generates them automatically)
- Verify the server is starting correctly

### Performance

- **Local dev**: ~20s (single browser, dev server)
- **Production test**: ~30s (single browser, production build)
- **Full CI**: ~60s (5 browsers, production build)

---

## Unit Test Coverage Needed (Future)

This section outlines test coverage that should be added when a testing framework (Jest/Vitest) is set up for this project.

### Priority: Type Safety Helpers (`embed-types.ts`)

The following functions need comprehensive test coverage to ensure runtime validation works correctly:

#### `isKnownMetric()`
Tests for validating metric key recognition:

```typescript
describe('isKnownMetric', () => {
  it('should return true for valid metric "ren"', () => {
    expect(isKnownMetric('ren')).toBe(true)
  })

  it('should return true for valid metric "new"', () => {
    expect(isKnownMetric('new')).toBe(true)
  })

  it('should return false for invalid metric "typo123"', () => {
    expect(isKnownMetric('typo123')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isKnownMetric('')).toBe(false)
  })

  it('should return false for non-string values', () => {
    expect(isKnownMetric('REN')).toBe(false) // Case sensitivity
  })
})
```

#### `getMetricValue()`
Tests for error handling and value extraction:

```typescript
describe('getMetricValue', () => {
  const validRow: StandardEmbedDataRow = {
    m: 11001,
    y: 2024,
    q: 1,
    ren: 10,
    new: 5
  }

  it('should extract valid metric value', () => {
    expect(getMetricValue(validRow, 'ren')).toBe(10)
    expect(getMetricValue(validRow, 'new')).toBe(5)
  })

  it('should throw helpful error for unknown metric', () => {
    expect(() => getMetricValue(validRow, 'typo123')).toThrow(
      'Unknown metric key: "typo123". Expected one of: ren, new. Add new metrics to KnownMetricKey type in embed-types.ts'
    )
  })

  it('should throw error for non-number values', () => {
    const invalidRow = { ...validRow, ren: 'not-a-number' as any }
    expect(() => getMetricValue(invalidRow, 'ren')).toThrow(
      'Expected number for metric "ren"'
    )
  })

  it('should throw error for missing metric', () => {
    const incompleteRow = { m: 11001, y: 2024, q: 1 } as StandardEmbedDataRow
    expect(() => getMetricValue(incompleteRow, 'ren')).toThrow()
  })
})
```

#### `transformToEmbedDataRows()` (from `embed-data-transformers.ts`)
Tests to ensure transformation and validation work together:

```typescript
describe('transformToEmbedDataRows', () => {
  const validData: StandardEmbedDataRow[] = [
    { m: 11001, y: 2024, q: 1, ren: 10, new: 5 },
    { m: 11001, y: 2024, q: 2, ren: 15, new: 7 }
  ]

  it('should transform valid data with "ren" metric', () => {
    const result = transformToEmbedDataRows(validData, 'ren')
    expect(result).toEqual([
      { ...validData[0], label: '2024-Q1', value: 10, periodCells: [2024, 1] },
      { ...validData[1], label: '2024-Q2', value: 15, periodCells: [2024, 2] }
    ])
  })

  it('should transform valid data with "new" metric', () => {
    const result = transformToEmbedDataRows(validData, 'new')
    expect(result).toEqual([
      { ...validData[0], label: '2024-Q1', value: 5, periodCells: [2024, 1] },
      { ...validData[1], label: '2024-Q2', value: 7, periodCells: [2024, 2] }
    ])
  })

  it('should throw error for invalid metric key', () => {
    expect(() => transformToEmbedDataRows(validData, 'invalid')).toThrow(
      'Unknown metric key: "invalid"'
    )
  })

  it('should handle empty array', () => {
    expect(transformToEmbedDataRows([], 'ren')).toEqual([])
  })
})
```

### Additional Test Coverage

#### Validation Functions
- `validateMunicipalityData()` - Test valid/invalid municipality arrays
- `validateEmbedDataRows()` - Test valid/invalid embed data rows
- `validateStandardEmbedDataRow()` - Test required fields (m, y, q) and metric validation

#### Type Guards
- `isMunicipalityData()` - Test type checking logic
- `isEmbedDataRow()` - Test periodCells optional handling

## Setting Up Testing

### Recommended: Vitest

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Alternative: Jest

```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
```

## Integration with CI/CD

Add test step to GitHub Actions workflow before build:
```yaml
- name: Run tests
  run: npm test
```
