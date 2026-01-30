---
kind: workflow
name: Filter Synchronization Implementation
summary: Centralized defaults and validation for analysis filters to ensure consistency between Dashboard, Embed, and URLs
inputs:
  - Analysis slug (e.g., 'faillissementen')
  - Filter definitions (sector, province, timeRange, etc.)
outputs:
  - Consistent defaults across Dashboard/Embed/EmbedClient
  - Validated filter values with error messages
  - Synchronized state between UI, data, and URLs
related:
  - docs/workflows/WF-url-sync-quick-reference.md
  - docs/workflows/URL-SYNC-ARCHITECTURE.md
  - embuild-analyses/src/lib/analysis-defaults.ts
  - embuild-analyses/src/lib/filter-validation.ts
  - embuild-analyses/src/lib/stores/embed-filters-store.ts
---

# Filter Synchronization Implementation

## Overview

This workflow ensures consistent filter behavior across Dashboards, Embeds, and URLs by providing:
1. **Centralized Defaults Registry** - Single source of truth for all analysis default values
2. **Validation Layer** - Validates filter values and returns clear error messages
3. **Improved Initialization** - Atomic, race-condition-free filter setup

## Problems Solved

### Bug #1: timeRange Mismatch
**Problem**: Dashboard defaulted to `'yearly'`, but Embed defaulted to `'monthly'`
**Result**: Users saw different data in dashboard vs embed
**Solution**: Both use `getAnalysisDefaults('faillissementen').timeRange` → consistent `'yearly'`

### Bug #2: Forced Sector Default
**Problem**: Dashboard called `setSector("F")` after `loadFromUrl()`, overwriting user intent
**Result**: URLs without sector param were forced to show "Bouw" instead of "Alle sectoren"
**Solution**: Use `useInitializeFiltersWithDefaults()` which applies defaults only when URL params are missing

### Bug #3: No Validation
**Problem**: Invalid province codes (e.g., `?province=99999`) showed empty data
**Result**: Users saw blank charts instead of error messages
**Solution**: `validateProvinceCode()` returns `{ valid: false, error: "Ongeldige provincie code: 99999" }`

### Bug #4: Race Conditions
**Problem**: Multiple `useEffect` hooks updating store → URL sync could be out of order
**Result**: Flaky embeds with incorrect filter combinations
**Solution**: Single atomic `loadFromUrlWithDefaults()` call in one `useEffect`

### Bug #5: Initialization Order
**Problem**: `loadFromUrl() → setSector("F") → syncToUrl()` caused multiple renders
**Result**: Unnecessary re-renders and unpredictable state
**Solution**: Merge URL > Defaults > Store defaults in one operation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ embuild-analyses/src/lib/analysis-defaults.ts              │
│ Central registry for all analysis default values           │
│                                                              │
│ ANALYSIS_DEFAULTS = {                                       │
│   "faillissementen": {                                      │
│     timeRange: "yearly",     // ✅ Consistent everywhere!   │
│     selectedSector: "ALL",   // ✅ "Alle sectoren"          │
│     selectedProvince: null,  // ✅ All Flanders             │
│   },                                                         │
│   "vergunningen-goedkeuringen": {                           │
│     timeRange: "monthly",    // Different per analysis      │
│     ...                                                      │
│   }                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ embuild-analyses/src/lib/filter-validation.ts              │
│ Validation utilities for all filter types                  │
│                                                              │
│ validateProvinceCode(code) → { valid, value, error }       │
│ validateSectorCode(code, validSectors) → { ... }           │
│ validateTimeRange(range) → { ... }                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ embuild-analyses/src/lib/stores/embed-filters-store.ts     │
│ Enhanced Zustand store with new methods                    │
│                                                              │
│ loadFromUrlWithDefaults(slug)                              │
│   1. Get defaults for analysis                             │
│   2. Read URL params                                        │
│   3. Merge: URL > Defaults > Store defaults                │
│   4. Apply in single atomic update                         │
│                                                              │
│ useInitializeFiltersWithDefaults(slug)                     │
│   Hook for dashboard initialization                        │
└─────────────────────────────────────────────────────────────┘
```

## How to Add New Analysis

### Step 1: Add Defaults to Registry

Edit `/Users/gerthuybrechts/pyprojects/data-blog/embuild-analyses/src/lib/analysis-defaults.ts`:

```typescript
const ANALYSIS_DEFAULTS: Record<string, AnalysisDefaults> = {
  // ... existing analyses

  "your-analysis-slug": {
    timeRange: "yearly",  // or "monthly", per analysis
    selectedSector: null,  // null = "All", or specific default
    selectedProvince: null,
    currentView: "chart",
    // ... other filters your analysis uses
  },
}
```

### Step 2: Update Dashboard Component

Replace manual initialization with `useInitializeFiltersWithDefaults()`:

**Before:**
```typescript
export function YourAnalysisDashboard() {
  const loadFromUrl = useEmbedFilters((state) => state.loadFromUrl)
  const setAnalysisContext = useEmbedFilters((state) => state.setAnalysisContext)
  const setSector = useEmbedFilters((state) => state.setSector)

  React.useEffect(() => {
    setAnalysisContext("your-analysis")
    loadFromUrl()

    // ❌ BUG: Forces default
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (!params.has('sector')) {
        setSector("F")
      }
    }
  }, [setAnalysisContext, loadFromUrl, setSector])

  const sectorValue = selectedSector ?? "F"  // ❌ Hides null state
  // ...
}
```

**After:**
```typescript
import { useInitializeFiltersWithDefaults } from "@/lib/stores/embed-filters-store"

export function YourAnalysisDashboard() {
  // ✅ Single line initialization
  useInitializeFiltersWithDefaults("your-analysis")

  const selectedSector = useEmbedFilters((state) => state.selectedSector)
  const sectorValue = selectedSector ?? "ALL"  // ✅ Safe fallback
  // ...
}
```

### Step 3: Update Embed Component

Add validation and use registry defaults:

**Before:**
```typescript
export function YourAnalysisEmbed({
  sector = "F",              // ❌ Hardcoded
  timeRange = "monthly",     // ❌ Different from dashboard!
  provinceCode = null,       // ❌ No validation
}: Props) {
  const data = getData(sector, provinceCode)
  // ...
}
```

**After:**
```typescript
import { getAnalysisDefaults } from "@/lib/analysis-defaults"
import { validateProvinceCode, validateTimeRange } from "@/lib/filter-validation"

const DEFAULTS = getAnalysisDefaults('your-analysis')

export function YourAnalysisEmbed({
  sector: sectorProp = DEFAULTS.selectedSector as string,  // ✅ From registry
  timeRange: timeRangeProp = DEFAULTS.timeRange!,          // ✅ Consistent!
  provinceCode: provinceCodeProp = null,
}: Props) {
  // ✅ Validate all inputs
  const provinceValidation = useMemo(
    () => validateProvinceCode(provinceCodeProp),
    [provinceCodeProp]
  )

  const timeRangeValidation = useMemo(
    () => validateTimeRange(timeRangeProp),
    [timeRangeProp]
  )

  // ✅ Show error if validation fails
  if (!provinceValidation.valid) {
    return (
      <div className="p-8 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700 font-semibold mb-2">Fout in provincie filter</p>
        <p className="text-red-600 text-sm">{provinceValidation.error}</p>
      </div>
    )
  }

  // Use validated values
  const provinceCode = provinceValidation.value
  const timeRange = timeRangeValidation.value ?? DEFAULTS.timeRange!

  const data = getData(sector, provinceCode, timeRange)
  // ...
}
```

### Step 4: Update EmbedClient

Use registry defaults instead of hardcoded values:

**Before:**
```typescript
// In EmbedClient.tsx for your analysis
const timeRange = urlParams.timeRange ?? "monthly"  // ❌ Hardcoded
const sector = urlParams.sector ?? "F"              // ❌ Hardcoded

return (
  <YourAnalysisEmbed
    sector={sector}
    timeRange={timeRange}
    // ...
  />
)
```

**After:**
```typescript
import { getAnalysisDefaults } from "@/lib/analysis-defaults"

// In EmbedClient.tsx for your analysis
const defaults = getAnalysisDefaults('your-analysis')

const timeRange = urlParams.timeRange ?? defaults.timeRange
const sector = urlParams.sector ?? defaults.selectedSector

return (
  <YourAnalysisEmbed
    sector={sector}
    timeRange={timeRange}
    // ...
  />
)
```

## Testing Checklist

After implementing for a new analysis:

### 1. Default Initialization (No URL params)
- [ ] Navigate to `/analyses/your-analysis/`
- [ ] Verify filters show expected defaults (from registry)
- [ ] Verify no params added to URL automatically
- [ ] Verify data matches filter state

### 2. URL Loading with Valid Params
- [ ] Navigate to `/analyses/your-analysis/?sector=F&province=10000&range=monthly`
- [ ] Verify all filters load from URL correctly
- [ ] Verify no extra re-renders (check console)
- [ ] Verify data matches URL filters

### 3. Invalid Filter Values in URL
- [ ] Navigate to `/analyses/your-analysis/?province=99999`
- [ ] Verify error message shown: "Fout in provincie filter"
- [ ] Verify error details: "Ongeldige provincie code: 99999"
- [ ] Verify NO data shown (validation prevents bad data)

### 4. Filter Changes Update URL
- [ ] Start at `/analyses/your-analysis/`
- [ ] Change filters via UI
- [ ] Verify URL updates correctly
- [ ] Browser back → filters revert

### 5. Embed Generation Matches Dashboard
- [ ] Set filters in dashboard
- [ ] Click "Embed" button
- [ ] Verify iframe src includes ALL current filters
- [ ] Open embed in new tab
- [ ] Verify shows SAME data as dashboard

### 6. Embed with No Filters
- [ ] Dashboard at `/analyses/your-analysis/` (no filters)
- [ ] Click "Embed" button
- [ ] Verify iframe src uses defaults (or has no params)
- [ ] Open embed
- [ ] Verify shows default state (matches dashboard)

## Common Pitfalls

### ❌ Don't hardcode defaults in components
```typescript
// ❌ BAD
const sector = selectedSector ?? "F"

// ✅ GOOD
const defaults = getAnalysisDefaults('your-analysis')
const sector = selectedSector ?? defaults.selectedSector
```

### ❌ Don't force defaults when user wants "All"
```typescript
// ❌ BAD
if (!params.has('sector')) {
  setSector("F")  // Overwrites user intent
}

// ✅ GOOD
useInitializeFiltersWithDefaults('your-analysis')  // Only applies defaults if truly missing
```

### ❌ Don't skip validation on Embed
```typescript
// ❌ BAD
export function YourEmbed({ provinceCode }: Props) {
  const data = getData(provinceCode)  // Invalid code → empty data
}

// ✅ GOOD
const validation = validateProvinceCode(provinceCode)
if (!validation.valid) {
  return <Error message={validation.error} />
}
```

### ❌ Don't use different defaults in Dashboard vs Embed
```typescript
// ❌ BAD
// Dashboard: timeRange = 'yearly'
// Embed: timeRange = 'monthly'
// → Users see different data!

// ✅ GOOD
const DEFAULTS = getAnalysisDefaults('your-analysis')
const timeRange = DEFAULTS.timeRange  // Same everywhere
```

## Migration Status

| Analysis | Defaults | Dashboard | Embed | EmbedClient | Tested | Done |
|----------|----------|-----------|-------|-------------|--------|------|
| faillissementen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| vergunningen-goedkeuringen | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| gebouwenpark | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| prijsherziening | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| woningmarkt | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| vastgoed-verkopen | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| starters-stoppers | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| huishoudensgroei | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| energiekaart-premies | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| vergunningen-aanvragen | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| gemeentelijke-investeringen | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| bouwprojecten-gemeenten | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| bouwondernemers | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| betaalbaar-arr | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| silc-energie-2023 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| vastgoed-prijzen | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## Files Reference

### Core Infrastructure
- **[analysis-defaults.ts](embuild-analyses/src/lib/analysis-defaults.ts)** - Central defaults registry
- **[filter-validation.ts](embuild-analyses/src/lib/filter-validation.ts)** - Validation utilities
- **[embed-filters-store.ts](embuild-analyses/src/lib/stores/embed-filters-store.ts)** - Enhanced Zustand store

### Faillissementen (Reference Implementation)
- **[FaillissementenDashboard.tsx](embuild-analyses/src/components/analyses/faillissementen/FaillissementenDashboard.tsx:1489-1497)** - Uses `useInitializeFiltersWithDefaults()`
- **[FaillissementenEmbed.tsx](embuild-analyses/src/components/analyses/faillissementen/FaillissementenEmbed.tsx:415-460)** - Validation and registry defaults
- **[EmbedClient.tsx](embuild-analyses/src/app/embed/[slug]/[section]/EmbedClient.tsx:351-370)** - Registry defaults instead of hardcoded

### Tests
- **[analysis-defaults.test.ts](embuild-analyses/src/lib/__tests__/analysis-defaults.test.ts)** - Unit tests for defaults
- **[filter-validation.test.ts](embuild-analyses/src/lib/__tests__/filter-validation.test.ts)** - Unit tests for validation

## Success Metrics

✅ **All bugs fixed**:
1. timeRange consistent everywhere
2. No forced sector defaults
3. Province validation works
4. No race conditions
5. Correct initialization order

✅ **User experience improved**:
- Dashboard filters = Embed filters (always)
- URL sharing works (copy URL → same view)
- Browser back/forward works
- Error messages for invalid filters
- "No value" clearly shown as "Alle [filter]"

✅ **Developer experience improved**:
- Central defaults registry (one place to update)
- Type-safe validation utilities
- Clear migration guide
- Comprehensive tests

## Related Documentation

- [URL Sync Quick Reference](WF-url-sync-quick-reference.md) - URL parameter naming conventions
- [URL Sync Architecture](URL-SYNC-ARCHITECTURE.md) - Overall URL sync system design
- [Embed Data Registry](../files/embuild-analyses/src/lib/embed-data-registry.ts.md) - Embed data configuration
