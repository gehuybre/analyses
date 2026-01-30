---
kind: workflow
id: WF-url-sync-quick-reference
title: URL Sync Quick Reference Guide
owner: Unknown
status: active
trigger: manual
slug: url-sync-quick-reference
parent: WF-url-synced-state-implementation.md
created: 2026-01-22
tags: [reference, cheatsheet, url-sync, zustand]
files:
  - embuild-analyses/src/lib/stores/embed-filters-store.ts
  - embuild-analyses/src/components/analyses/shared/ExportButtons.tsx
  - embuild-analyses/src/components/analyses/faillissementen/FaillissementenDashboard.tsx
last_reviewed: 2026-01-25
---

# URL Sync Quick Reference Guide

Quick reference for developers working with the URL-synced state management system.

## Installation

```bash
npm install zustand  # Already installed if following implementation plan
```

## Basic Usage

### 1. Initialize Filters in Dashboard

```tsx
import { useEmbedFilters, useInitializeFilters } from '@/lib/stores/embed-filters-store'

export function MyDashboard() {
  // Load filters from URL on mount
  useInitializeFilters()

  // Access filter state
  const selectedYear = useEmbedFilters((state) => state.selectedYear)
  const setYear = useEmbedFilters((state) => state.setYear)

  // Set defaults if needed
  useEffect(() => {
    if (selectedYear === null) setYear(2024)
  }, [selectedYear, setYear])

  return <YearSelector value={selectedYear} onChange={setYear} />
}
```

### 2. Update ExportButtons (No Changes Needed!)

```tsx
<ExportButtons
  slug="analysis-slug"
  sectionId="section-id"
  viewType={currentView}
  // embedParams is DEPRECATED - filters auto-synced from URL
/>
```

### 3. Multiple Filters Example

```tsx
export function FaillissementenDashboard() {
  useInitializeFilters()

  const { selectedYear, setYear } = useTimeFilters()
  const { selectedSector, setSector } = useEmbedFilters((state) => ({
    selectedSector: state.selectedSector,
    setSector: state.setSector,
  }))
  const { currentView, setView } = useViewState()

  return (
    <>
      <YearSelector value={selectedYear} onChange={setYear} />
      <SectorSelector value={selectedSector} onChange={setSector} />
      <ViewTabs value={currentView} onChange={setView} />
    </>
  )
}
```

## Specialized Hooks

### Time Filters Only

```tsx
import { useTimeFilters } from '@/lib/stores/embed-filters-store'

const {
  selectedYear,
  selectedQuarter,
  timeRange,
  setYear,
  setQuarter,
  setTimeRange,
} = useTimeFilters()
```

### Geographic Filters Only

```tsx
import { useGeoFilters } from '@/lib/stores/embed-filters-store'

const {
  selectedRegion,
  selectedProvince,
  selectedMunicipality,
  setRegion,
  setProvince,
  setMunicipality,
} = useGeoFilters()
```

### UI State Only

```tsx
import { useViewState } from '@/lib/stores/embed-filters-store'

const {
  currentView,
  currentChartType,
  showMovingAverage,
  setView,
  setChartType,
  toggleMovingAverage,
} = useViewState()
```

## Common Patterns

### Setting Multiple Filters at Once

```tsx
const setYear = useEmbedFilters((state) => state.setYear)
const setSector = useEmbedFilters((state) => state.setSector)
const setProvince = useEmbedFilters((state) => state.setProvince)

// These batch automatically - only one URL update
setYear(2024)
setSector('F')
setProvince('10000')
```

### Resetting All Filters

```tsx
const reset = useEmbedFilters((state) => state.reset)

<button onClick={() => reset()}>Reset alle filters</button>
```

### Resetting with Preserved Values

```tsx
const reset = useEmbedFilters((state) => state.reset)

<button onClick={() => reset({ selectedYear: 2024 })}>
  Reset (behoud jaar)
</button>
```

### Conditional Defaults

```tsx
useEffect(() => {
  if (selectedYear === null) setYear(2024)
  if (selectedSector === null) setSector('F')
}, [selectedYear, selectedSector, setYear, setSector])
```

### Getting Full State as Object

```tsx
const toEmbedParams = useEmbedFilters((state) => state.toEmbedParams)

const params = toEmbedParams()
// → { year: 2024, sector: 'F', province: '10000', view: 'chart' }
```

### Getting Query String

```tsx
const toQueryString = useEmbedFilters((state) => state.toQueryString)

const queryString = toQueryString()
// → "year=2024&sector=F&province=10000&view=chart"
```

## URL Parameter Names

| Filter | URL Param | Example |
|--------|-----------|---------|
| Year | `year` | `?year=2024` |
| Quarter | `q` | `?q=3` |
| Month | `month` | `?month=6` |
| Time Range | `range` | `?range=monthly` |
| Region | `region` | `?region=2000` |
| Province | `province` | `?province=10000` |
| Municipality | `municipality` | `?municipality=11001` |
| Sector | `sector` | `?sector=F` |
| View | `view` | `?view=map` |
| Chart Type | `chartType` | `?chartType=line` |
| Moving Average | `ma` | `?ma=1` |

[See full reference in WF-url-synced-state-implementation.md]

## Migration Checklist

Use this checklist when migrating an analysis:

- [ ] Add `useInitializeFilters()` at top of dashboard
- [ ] Replace `useState` with `useEmbedFilters` selectors
- [ ] Replace setter calls with store setters
- [ ] Set defaults for required filters
- [ ] Remove `embedParams` from `<ExportButtons>`
- [ ] Test filters work in main page
- [ ] Test URL updates when filters change
- [ ] Test refresh preserves filters
- [ ] Test embed code includes filters
- [ ] Test embed renders with filters
- [ ] Update custom embed component (if exists)
- [ ] Add E2E tests

## Debugging

### Check Current State

Open Redux DevTools in browser:
1. Look for "EmbedFilters" store
2. Inspect current state
3. View action history
4. Time-travel through state changes

### Check URL Sync

```tsx
// Add temporary logging
const syncToUrl = useEmbedFilters((state) => state.syncToUrl)

useEffect(() => {
  console.log('Current URL:', window.location.href)
  console.log('Store state:', useEmbedFilters.getState())
}, [])
```

### Common Issues

**Filters not loading from URL:**
- Check `useInitializeFilters()` is called
- Verify URL params are correct format
- Check console for errors

**URL not updating:**
- Ensure setter is from store (not local useState)
- Check `syncToUrl()` is called in setter
- Verify browser history API is available

**Filters reset on navigation:**
- Check `useInitializeFilters()` is in parent component
- Ensure not calling `reset()` unintentionally

## Performance Tips

### Use Selective Subscriptions

```tsx
// ✅ Good - only re-renders when year changes
const selectedYear = useEmbedFilters((state) => state.selectedYear)

// ❌ Bad - re-renders on ANY state change
const store = useEmbedFilters()
const selectedYear = store.selectedYear
```

### Use Specialized Hooks

```tsx
// ✅ Good - only subscribes to time filters
const { selectedYear, setYear } = useTimeFilters()

// ⚠️ OK but less optimal - subscribes to entire store
const selectedYear = useEmbedFilters((state) => state.selectedYear)
const setYear = useEmbedFilters((state) => state.setYear)
```

### Combine Related Selectors

```tsx
// ✅ Good - single subscription for related filters
const { selectedYear, selectedSector } = useEmbedFilters((state) => ({
  selectedYear: state.selectedYear,
  selectedSector: state.selectedSector,
}))

// ⚠️ Less optimal - two separate subscriptions
const selectedYear = useEmbedFilters((state) => state.selectedYear)
const selectedSector = useEmbedFilters((state) => state.selectedSector)
```

## Testing Examples

### Unit Test

```typescript
import { renderHook, act } from '@testing-library/react'
import { useEmbedFilters } from './embed-filters-store'

test('setYear updates state and URL', () => {
  const { result } = renderHook(() => useEmbedFilters())

  act(() => {
    result.current.setYear(2024)
  })

  expect(result.current.selectedYear).toBe(2024)
  expect(window.location.search).toContain('year=2024')
})
```

### E2E Test

```typescript
import { test, expect } from '@playwright/test'

test('filters persist on refresh', async ({ page }) => {
  await page.goto('/analyses/faillissementen/')

  // Set filters
  await page.selectOption('[data-testid="year-selector"]', '2024')
  await page.waitForURL('**/year=2024*')

  // Refresh
  await page.reload()

  // Check persisted
  await expect(page.locator('[data-testid="year-selector"]')).toHaveValue('2024')
})
```

## Example URLs

### Simple Filter

```
/analyses/faillissementen/?year=2024
```

### Multiple Filters

```
/analyses/faillissementen/?year=2024&sector=F&province=10000&view=map
```

### Complex Filter State

```
/analyses/gemeentelijke-investeringen/
?perspective=BV
&field=01
&reportYear=2026
&province=10000
&view=chart
```

### Embed URL

```
/embed/faillissementen/evolutie/
?year=2024
&sector=F
&province=10000
&view=chart
&range=monthly
```

## Support

- **Implementation Guide:** [WF-url-synced-state-implementation.md](./WF-url-synced-state-implementation.md)
- **Store Documentation:** [../files/embuild-analyses/src/lib/stores/embed-filters-store.md](../files/embuild-analyses/src/lib/stores/embed-filters-store.md)
- **Migration Status:** [WF-url-sync-migration-status.md](./WF-url-sync-migration-status.md)
