---
kind: workflow
id: WF-url-synced-state-implementation
title: URL-Synced State Management Implementation Plan
owner: Unknown
status: in-progress
trigger: manual
slug: url-synced-state-implementation
created: 2026-01-22
updated: 2026-01-22
tags: [architecture, state-management, zustand, embeds, url-sync]
related:
  - ../files/embuild-analyses/src/lib/stores/embed-filters-store.md
  - WF-embed-system.md
inputs:
  - Manual filter state in components (useState)
  - Manual embedParams passing to ExportButtons
  - Inconsistent embed URLs
outputs:
  - Centralized Zustand store with URL sync
  - Automatic embed URL generation
  - Shareable filtered views
  - Browser history navigation
files:
  - embuild-analyses/src/lib/stores/embed-filters-store.ts
  - embuild-analyses/src/components/analyses/faillissementen/FaillissementenDashboard.tsx
  - embuild-analyses/src/components/analyses/shared/ExportButtons.tsx
  - embuild-analyses/src/lib/embed-config.ts
last_reviewed: 2026-01-25
---

# URL-Synced State Management Implementation Plan

## Executive Summary

**Goal:** Implement centralized state management with automatic URL synchronization to make all filtered analysis views perfectly shareable via embeds and direct links.

**Approach:** Phased migration using Zustand with URL sync middleware, starting with a single analysis as proof-of-concept, then rolling out systematically.

**Timeline:** 3-5 days for complete implementation across all 16 analyses

**Risk Level:** Low (backward compatible, opt-in migration per analysis)

## Benefits

### User Experience
1. **Perfect Embed Accuracy**: Embeds always show exact filtered view user was seeing
2. **Direct Link Sharing**: Share any filtered view via URL
3. **Browser Navigation**: Back/forward buttons work through filter changes
4. **URL Persistence**: Refresh page, filters remain

### Developer Experience
1. **No Manual `embedParams`**: ExportButtons auto-reads URL state
2. **Single Source of Truth**: All filter state in one store
3. **Easy New Filters**: Add to store once, works everywhere
4. **Type Safety**: Full TypeScript support
5. **DevTools**: Redux DevTools integration for debugging

### Analytics & SEO
1. **Filter Tracking**: Track which filters users interact with
2. **Popular Views**: Identify most-shared filtered views
3. **Embed Usage**: Monitor which embeds get used most

---

## Phase 0: Preparation & Architecture ✅ COMPLETE

### 0.1 Install Dependencies ✅

```bash
cd embuild-analyses
npm install zustand
```

### 0.2 Create Core Store Infrastructure ✅

**File created:** `embuild-analyses/src/lib/stores/embed-filters-store.ts`

**Features:**
- Comprehensive filter state (time, geo, sector, UI, analysis-specific)
- Automatic URL sync after each state change
- Load state from URL on mount
- Utility hooks for specific filter groups
- TypeScript strict mode compatible
- Redux DevTools integration

---

## Phase 1: Proof of Concept - Faillissementen Analysis (Day 1 Afternoon)

### Goals
- Validate store architecture with real component
- Test URL sync functionality
- Ensure backward compatibility
- Document migration pattern for other analyses

### 1.1 Update FaillissementenDashboard Component

**File:** `embuild-analyses/src/components/analyses/faillissementen/FaillissementenDashboard.tsx`

**Changes:**

```tsx
// BEFORE (lines 767-1305)
const [currentView, setCurrentView] = React.useState<"chart" | "table" | "map">("chart")
const [timeRange, setTimeRange] = React.useState<"monthly" | "yearly">("monthly")
const [selectedYear, setSelectedYear] = React.useState(currentYear)
const [selectedSector, setSelectedSector] = React.useState<string>("F")
const [selectedProvince, setSelectedProvince] = React.useState<string | null>(null)

// AFTER
import { useEmbedFilters, useInitializeFilters } from '@/lib/stores/embed-filters-store'

export function FaillissementenDashboard() {
  // Initialize filters from URL
  useInitializeFilters()

  // Get filter state from store
  const currentView = useEmbedFilters((state) => state.currentView)
  const setView = useEmbedFilters((state) => state.setView)
  const timeRange = useEmbedFilters((state) => state.timeRange)
  const setTimeRange = useEmbedFilters((state) => state.setTimeRange)
  const selectedYear = useEmbedFilters((state) => state.selectedYear)
  const setYear = useEmbedFilters((state) => state.setYear)
  const selectedSector = useEmbedFilters((state) => state.selectedSector)
  const setSector = useEmbedFilters((state) => state.setSector)
  const selectedProvince = useEmbedFilters((state) => state.selectedProvince)
  const setProvince = useEmbedFilters((state) => state.setProvince)

  // Set default values if not in URL
  React.useEffect(() => {
    if (selectedYear === null) setYear(currentYear)
    if (selectedSector === null) setSector("F")
  }, [selectedYear, setYear, selectedSector, setSector])

  // Component logic remains the same, just uses store values
  // ...
}
```

**Testing Checklist:**
- [ ] Filters load from URL on page load
- [ ] Changing filters updates URL
- [ ] URL params match expected format (e.g., `?year=2024&sector=F&view=chart`)
- [ ] Browser back/forward works
- [ ] Refresh preserves filters
- [ ] Multiple instances don't conflict

### 1.2 Update ExportButtons to Auto-Read URL

**File:** `embuild-analyses/src/components/analyses/shared/ExportButtons.tsx`

**Changes:**

```tsx
// BEFORE (lines 40-41, 148-157)
interface ExportButtonsProps {
  // ... existing props
  embedParams?: Record<string, string | number | null | undefined>  // ← REMOVE
}

// Build query params including view and any additional embed params
const params = new URLSearchParams()
params.set("view", viewType)

if (embedParams) {  // ← REMOVE
  for (const [key, value] of Object.entries(embedParams)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  }
}

// AFTER
import { useEmbedFilters } from '@/lib/stores/embed-filters-store'

interface ExportButtonsProps {
  // ... existing props
  // embedParams removed - now automatic!
}

export function ExportButtons({ ... }: ExportButtonsProps) {
  const toQueryString = useEmbedFilters((state) => state.toQueryString)

  const getEmbedCode = useCallback((): string => {
    // ... validation code

    // Get current filter state as query string
    const filterParams = toQueryString()

    // Build embed URL with ALL current filters
    const embedUrl = `${baseUrl}/embed/${encodedSlug}/${encodedSectionId}/?${filterParams}`

    return `<iframe src="${embedUrl}" ...></iframe>`
  }, [slug, sectionId, toQueryString])

  // ... rest of component
}
```

**Backward Compatibility:**
Keep `embedParams` prop as optional with deprecation warning:

```tsx
interface ExportButtonsProps {
  /** @deprecated Filters are now auto-synced from store. This prop is ignored. */
  embedParams?: Record<string, string | number | null | undefined>
}
```

**Testing Checklist:**
- [ ] Embed code includes all active filters
- [ ] Generated iframe URL matches current page URL filters
- [ ] Copy to clipboard works
- [ ] Embed renders correctly in test HTML

### 1.3 Test Embed Rendering

**File:** `tests/manual/embed-test-faillissementen.html`

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faillissementen Embed Test - URL Sync</title>
</head>
<body>
  <h1>Test: Faillissementen met URL Filters</h1>

  <h2>1. Default View (no filters)</h2>
  <iframe
    src="http://localhost:3000/embed/faillissementen/evolutie/?view=chart"
    data-data-blog-embed="true"
    width="100%"
    height="600"
    style="border: 1px solid #ccc;"
    title="Faillissementen - Default"
  ></iframe>

  <h2>2. Filtered: 2024, Construction Sector (F), Antwerp</h2>
  <iframe
    src="http://localhost:3000/embed/faillissementen/evolutie/?view=chart&year=2024&sector=F&province=10000"
    data-data-blog-embed="true"
    width="100%"
    height="600"
    style="border: 1px solid #ccc;"
    title="Faillissementen - Filtered"
  ></iframe>

  <h2>3. Map View, Yearly, All Sectors</h2>
  <iframe
    src="http://localhost:3000/embed/faillissementen/evolutie/?view=map&range=yearly&year=2023"
    data-data-blog-embed="true"
    width="100%"
    height="600"
    style="border: 1px solid #ccc;"
    title="Faillissementen - Map"
  ></iframe>

  <script>
    (function () {
      if (window.__DATA_BLOG_EMBED_RESIZER__) return;
      window.__DATA_BLOG_EMBED_RESIZER__ = true;

      window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.type !== "data-blog-embed:resize") return;
        var height = Number(data.height);
        if (!isFinite(height) || height <= 0) return;

        var iframes = document.querySelectorAll('iframe[data-data-blog-embed="true"]');
        for (var i = 0; i < iframes.length; i++) {
          var iframe = iframes[i];
          if (iframe.contentWindow === event.source) {
            iframe.style.height = Math.ceil(height) + "px";
            return;
          }
        }
      });
    })();
  </script>
</body>
</html>
```

**Manual Test Steps:**
1. Start dev server: `npm run dev`
2. Open `tests/manual/embed-test-faillissementen.html` in browser
3. Verify all three embeds render correctly
4. Verify filters match URL params
5. Interact with filters in embed, check URL updates
6. Copy embed code from main page, verify it includes filters

### 1.4 Update EmbedClient for Faillissementen

**File:** `embuild-analyses/src/app/embed/[slug]/[section]/EmbedClient.tsx`

**Changes:**

```tsx
// Add initialization at component mount
export function EmbedClient({ slug, section }: EmbedClientProps) {
  const loadFromUrl = useEmbedFilters((state) => state.loadFromUrl)
  const setAnalysisContext = useEmbedFilters((state) => state.setAnalysisContext)

  // Initialize from URL params on mount
  useEffect(() => {
    setAnalysisContext(slug)
    loadFromUrl()
  }, [slug, loadFromUrl, setAnalysisContext])

  // Remove getParamsFromUrl() - now handled by store

  // Rest of component...
}
```

**Testing Checklist:**
- [ ] Embed loads with URL filters applied
- [ ] Filters persist in embed after interactions
- [ ] Multiple embeds on same page don't conflict

---

## Phase 2: Update Shared Components (Day 2 Morning)

### 2.1 Update AnalysisSection Component

**File:** `embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx`

**Changes:**

```tsx
// Replace local view state with store
import { useEmbedFilters } from '@/lib/stores/embed-filters-store'

export function AnalysisSection({ ... }: AnalysisSectionProps) {
  // BEFORE
  const [currentView, setCurrentView] = useState<ViewType>("chart")

  // AFTER
  const currentView = useEmbedFilters((state) => state.currentView)
  const setView = useEmbedFilters((state) => state.setView)

  // Set default if not already set
  useEffect(() => {
    if (!currentView) setView("chart")
  }, [currentView, setView])

  // Rest of component uses store values
}
```

### 2.2 Update TimeSeriesSection Component

**File:** `embuild-analyses/src/components/analyses/shared/TimeSeriesSection.tsx`

Same pattern as AnalysisSection.

### 2.3 Update GeoFilter Component

**File:** `embuild-analyses/src/components/analyses/shared/GeoFilter.tsx`

**Changes:**

```tsx
import { useGeoFilters } from '@/lib/stores/embed-filters-store'

export function GeoFilter() {
  // Use specialized hook for geo filters
  const {
    selectedRegion,
    selectedProvince,
    selectedMunicipality,
    geoLevel,
    setRegion,
    setProvince,
    setMunicipality,
    setGeoLevel,
  } = useGeoFilters()

  // Component logic remains the same
}
```

**Note:** Keep backward compatibility with GeoContext for analyses not yet migrated.

---

## Phase 3: Migrate Remaining Analyses (Days 2-3)

### Priority Order (by complexity)

1. **Simple Analyses** (Day 2 Afternoon)
   - [ ] `gebouwenpark` - Single view, minimal filters
   - [ ] `huishoudensgroei` - Time + geo filters only
   - [ ] `prijsherziening-index-i-2021` - Time series only

2. **Medium Complexity** (Day 3 Morning)
   - [ ] `vergunningen-aanvragen` - Multi-metric, geo filters
   - [ ] `vergunningen-goedkeuringen` - Period comparisons
   - [ ] `vastgoed-verkopen` - Property type + geo
   - [ ] `starters-stoppers` - Sector + survival horizon
   - [ ] `energiekaart-premies` - Measure type filter

3. **Complex Analyses** (Day 3 Afternoon)
   - [ ] `gemeentelijke-investeringen` - Multiple perspectives (BV/REK), fields
   - [ ] `bouwprojecten-gemeenten` - Search, sorting, budget ranges
   - [ ] `bouwondernemers` - Multiple breakdowns (sector, gender, age)
   - [ ] `betaalbaar-arr` - Cross-analysis correlations
   - [ ] `silc-energie-2023` - Income quintiles, tenure status

### Migration Checklist Per Analysis

For each analysis, complete these steps:

#### Step 1: Identify Filter State
- [ ] List all `useState` calls for filters
- [ ] Map to store properties (e.g., `selectedYear` → `state.selectedYear`)
- [ ] Identify analysis-specific filters

#### Step 2: Update Dashboard Component
- [ ] Add `useInitializeFilters()` hook
- [ ] Replace `useState` with `useEmbedFilters` selectors
- [ ] Replace setter calls (e.g., `setView()` → store's `setView()`)
- [ ] Set defaults for required filters

#### Step 3: Remove Manual embedParams
- [ ] Find all `<ExportButtons>` calls
- [ ] Remove `embedParams` prop
- [ ] Test generated embed URLs

#### Step 4: Test Functionality
- [ ] Filters work in main page
- [ ] URL updates when filters change
- [ ] Refresh preserves filters
- [ ] Embed code includes filters
- [ ] Embed renders with filters

#### Step 5: Update Embed Component
- [ ] Update custom embed component (if exists)
- [ ] Remove manual URL param reading
- [ ] Use store selectors instead

---

## Phase 4: Enhanced Features (Day 4)

### 4.1 Browser History Integration

**File:** `embuild-analyses/src/lib/stores/embed-filters-store.ts`

Add optional history mode:

```tsx
interface HistoryOptions {
  enabled: boolean
  useReplace: boolean  // replaceState vs pushState
}

// Add to store actions
enableHistory: (options: HistoryOptions) => void

// In syncToUrl():
syncToUrl: () => {
  const state = get()
  const params = new URLSearchParams()

  // ... build params

  const newUrl = `${window.location.pathname}?${params.toString()}`

  if (state.historyEnabled) {
    if (state.useReplace) {
      window.history.replaceState({}, '', newUrl)
    } else {
      window.history.pushState({}, '', newUrl)
    }
  }
}
```

Usage:

```tsx
// In dashboard
const enableHistory = useEmbedFilters((state) => state.enableHistory)

useEffect(() => {
  enableHistory({ enabled: true, useReplace: false })  // Push to history
}, [enableHistory])
```

### 4.2 Analytics Integration

**File:** `embuild-analyses/src/lib/stores/analytics-middleware.ts`

```tsx
import { StateCreator } from 'zustand'

export const analyticsMiddleware = <T extends object>(
  config: StateCreator<T>
): StateCreator<T> => (set, get, api) =>
  config(
    (args) => {
      // Track state changes
      if (typeof window !== 'undefined' && window.gtag) {
        // Extract filter changes
        const prev = get()
        const next = typeof args === 'function' ? args(prev) : args

        // Find what changed
        for (const [key, value] of Object.entries(next)) {
          if (prev[key as keyof T] !== value && key !== 'lastUpdated') {
            window.gtag('event', 'filter_change', {
              filter_name: key,
              filter_value: String(value),
              analysis_slug: (next as any).analysisSlug,
            })
          }
        }
      }

      set(args)
    },
    get,
    api
  )

// Apply to store:
export const useEmbedFilters = create<EmbedFiltersStore>()(
  analyticsMiddleware(
    devtools((set, get) => ({ /* ... */ }))
  )
)
```

### 4.3 Preset Filter Views

**File:** `embuild-analyses/src/lib/filter-presets.ts`

```tsx
export interface FilterPreset {
  id: string
  name: string
  description: string
  slug: string
  filters: Partial<EmbedFiltersState>
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'faillissementen-construction-2024',
    name: 'Bouwsector Faillissementen 2024',
    description: 'Faillissementen in de bouwsector voor 2024',
    slug: 'faillissementen',
    filters: {
      selectedYear: 2024,
      selectedSector: 'F',
      currentView: 'chart',
      timeRange: 'monthly',
    },
  },
  {
    id: 'vergunningen-renovatie-brussel',
    name: 'Renovatievergunningen Brussel',
    description: 'Goedgekeurde renovatievergunningen in Brussels Gewest',
    slug: 'vergunningen-goedkeuringen',
    filters: {
      selectedRegion: '2000',
      currentView: 'map',
    },
  },
  // ... more presets
]

// Helper to apply preset
export function useFilterPreset(presetId: string) {
  const preset = FILTER_PRESETS.find((p) => p.id === presetId)
  const setMultiple = useEmbedFilters((state) => state.reset)

  return () => {
    if (preset) {
      setMultiple(preset.filters)
    }
  }
}
```

Usage in UI:

```tsx
import { FILTER_PRESETS, useFilterPreset } from '@/lib/filter-presets'

function PresetSelector({ slug }: { slug: string }) {
  const presets = FILTER_PRESETS.filter((p) => p.slug === slug)

  return (
    <Select>
      {presets.map((preset) => {
        const applyPreset = useFilterPreset(preset.id)
        return (
          <SelectItem key={preset.id} onSelect={applyPreset}>
            {preset.name}
          </SelectItem>
        )
      })}
    </Select>
  )
}
```

### 4.4 Share Button with Copy Link

**File:** `embuild-analyses/src/components/analyses/shared/ShareButton.tsx`

```tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delen</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="font-medium text-sm">Deel deze weergave</div>
          <p className="text-xs text-muted-foreground">
            Kopieer de link om deze gefilterde weergave te delen.
          </p>
          <div className="bg-muted p-2 rounded text-xs break-all">
            {shareUrl}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={copyLink}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Link gekopieerd!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Kopieer link
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

Add to ExportButtons:

```tsx
// In ExportButtons.tsx
import { ShareButton } from './ShareButton'

export function ExportButtons({ ... }) {
  return (
    <div className="flex items-center gap-2">
      <ShareButton />  {/* New */}
      <Button variant="outline" size="sm" onClick={downloadCSV}>
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Popover>...</Popover>  {/* Embed */}
    </div>
  )
}
```

---

## Phase 5: Testing & Documentation (Day 5)

### 5.1 Automated Tests

**File:** `embuild-analyses/tests/e2e/url-sync.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('URL Sync - Faillissementen', () => {
  test('should load filters from URL', async ({ page }) => {
    await page.goto('/analyses/faillissementen/?year=2024&sector=F&province=10000&view=map')

    // Check filters are applied
    await expect(page.locator('[data-testid="year-selector"]')).toHaveValue('2024')
    await expect(page.locator('[data-testid="sector-selector"]')).toHaveValue('F')
    await expect(page.locator('[data-testid="province-selector"]')).toHaveValue('10000')
    await expect(page.locator('[data-testid="view-tabs"]')).toHaveAttribute('data-value', 'map')
  })

  test('should update URL when filters change', async ({ page }) => {
    await page.goto('/analyses/faillissementen/')

    // Change year
    await page.selectOption('[data-testid="year-selector"]', '2023')

    // Wait for URL to update
    await page.waitForURL('**/analyses/faillissementen/?*year=2023*')

    // Verify URL
    expect(page.url()).toContain('year=2023')
  })

  test('should preserve filters on refresh', async ({ page }) => {
    await page.goto('/analyses/faillissementen/')

    // Set filters
    await page.selectOption('[data-testid="year-selector"]', '2024')
    await page.selectOption('[data-testid="sector-selector"]', 'F')

    // Refresh page
    await page.reload()

    // Check filters persisted
    await expect(page.locator('[data-testid="year-selector"]')).toHaveValue('2024')
    await expect(page.locator('[data-testid="sector-selector"]')).toHaveValue('F')
  })

  test('should generate correct embed code', async ({ page }) => {
    await page.goto('/analyses/faillissementen/?year=2024&sector=F&view=chart')

    // Open embed popover
    await page.click('[data-testid="embed-button"]')

    // Get embed code
    const embedCode = await page.locator('[data-testid="embed-code"]').textContent()

    // Verify URL includes filters
    expect(embedCode).toContain('year=2024')
    expect(embedCode).toContain('sector=F')
    expect(embedCode).toContain('view=chart')
  })

  test('should work with browser back button', async ({ page }) => {
    await page.goto('/analyses/faillissementen/')

    // Change year
    await page.selectOption('[data-testid="year-selector"]', '2024')
    await page.waitForURL('**/year=2024*')

    // Change sector
    await page.selectOption('[data-testid="sector-selector"]', 'F')
    await page.waitForURL('**/sector=F*')

    // Go back
    await page.goBack()

    // Should be back to year=2024 without sector
    expect(page.url()).toContain('year=2024')
    expect(page.url()).not.toContain('sector')
  })
})

test.describe('Embed URL Sync', () => {
  test('should load embed with URL filters', async ({ page }) => {
    await page.goto('/embed/faillissementen/evolutie/?year=2024&sector=F&view=chart')

    // Wait for embed to render
    await page.waitForSelector('[data-testid="chart-container"]')

    // Verify filters applied
    // (check rendered data matches filtered state)
  })
})
```

Run tests:

```bash
npm run test:e2e
```

### 5.2 Update Documentation

#### 5.2.1 CLAUDE.md Updates

**File:** `CLAUDE.md`

Add new section:

```markdown
## State Management

### URL-Synced Filters

All analysis filters are managed through a centralized Zustand store with automatic URL synchronization.

**Key Features:**
- All filters automatically sync to URL query parameters
- Shareable filtered views via direct links
- Perfect embed accuracy (no manual `embedParams`)
- Browser back/forward navigation
- Type-safe filter state

**Usage Example:**

```tsx
import { useEmbedFilters, useInitializeFilters } from '@/lib/stores/embed-filters-store'

function MyDashboard() {
  // Initialize from URL on mount
  useInitializeFilters()

  // Get filter state and setters
  const selectedYear = useEmbedFilters((state) => state.selectedYear)
  const setYear = useEmbedFilters((state) => state.setYear)

  return (
    <div>
      <YearSelector value={selectedYear} onChange={setYear} />
      {/* Changing year automatically updates URL */}

      <ExportButtons
        slug="my-analysis"
        sectionId="overview"
        viewType="chart"
        {/* No embedParams needed - auto-synced! */}
      />
    </div>
  )
}
```

**Available Filter Hooks:**
- `useEmbedFilters()` - Full store access
- `useTimeFilters()` - Time-related filters only
- `useGeoFilters()` - Geographic filters only
- `useViewState()` - UI state only
- `useInitializeFilters()` - Auto-load from URL on mount

**URL Parameter Format:**

| Filter | URL Param | Example |
|--------|-----------|---------|
| Year | `year` | `?year=2024` |
| Quarter | `q` | `?year=2024&q=3` |
| Sector | `sector` | `?sector=F` |
| Province | `province` | `?province=10000` |
| View | `view` | `?view=map` |
| Time Range | `range` | `?range=monthly` |

See `embuild-filters-store.ts` for full parameter mapping.
```

#### 5.2.2 Create Store Documentation

**File:** `docs/files/embuild-analyses/src/lib/stores/embed-filters-store.md`

```markdown
---
kind: file
path: embuild-analyses/src/lib/stores/embed-filters-store.ts
purpose: Centralized state management for analysis filters with URL sync
status: active
created: 2026-01-22
updated: 2026-01-22
tags: [state-management, zustand, url-sync, filters]
dependencies:
  - zustand
  - ../geo-utils.ts
related:
  - ../../components/analyses/shared/ExportButtons.tsx
  - ../../../app/embed/[slug]/[section]/EmbedClient.tsx
---

# Embed Filters Store

Centralized Zustand store managing all analysis filter state with automatic URL synchronization.

## Architecture

### State Structure

```typescript
interface EmbedFiltersState {
  // Time filters
  selectedYear: number | null
  selectedQuarter: number | null
  timeRange: 'monthly' | 'yearly' | 'quarterly'

  // Geographic filters
  selectedRegion: RegionCode | null
  selectedProvince: ProvinceCode | null
  selectedMunicipality: MunicipalityCode | null

  // UI state
  currentView: 'chart' | 'table' | 'map'
  currentChartType: 'composed' | 'line' | 'bar' | 'area'

  // Analysis-specific filters
  selectedSector: string | null
  selectedPropertyType: string | null
  stopHorizon: 1 | 2 | 3 | 4 | 5 | null
  // ... (40+ filter properties)
}
```

### URL Synchronization

Every state change triggers automatic URL update via `syncToUrl()`:

```typescript
setYear: (year) => {
  set({ selectedYear: year, lastUpdated: Date.now() })
  get().syncToUrl()  // Auto-sync to URL
}
```

URL params are shortened for cleaner URLs:
- `selectedYear` → `year`
- `selectedProvince` → `province`
- `currentView` → `view`

### Loading from URL

Call `loadFromUrl()` on component mount to initialize state from URL:

```typescript
useEffect(() => {
  loadFromUrl()
}, [loadFromUrl])
```

Or use the convenience hook:

```typescript
useInitializeFilters()  // Same as above
```

## Usage Patterns

### Basic Filter Usage

```typescript
import { useEmbedFilters } from '@/lib/stores/embed-filters-store'

function YearFilter() {
  const selectedYear = useEmbedFilters((state) => state.selectedYear)
  const setYear = useEmbedFilters((state) => state.setYear)

  return (
    <select value={selectedYear || ''} onChange={(e) => setYear(+e.target.value)}>
      <option value="">Alle jaren</option>
      <option value="2024">2024</option>
      <option value="2023">2023</option>
    </select>
  )
}
```

### Specialized Hooks

For better performance, use specialized hooks that subscribe only to relevant state:

```typescript
// Time filters only
const { selectedYear, setYear } = useTimeFilters()

// Geographic filters only
const { selectedProvince, setProvince } = useGeoFilters()

// UI state only
const { currentView, setView } = useViewState()
```

### Setting Default Values

Set defaults conditionally after loading from URL:

```typescript
function Dashboard() {
  useInitializeFilters()

  const selectedYear = useEmbedFilters((state) => state.selectedYear)
  const setYear = useEmbedFilters((state) => state.setYear)

  // Set default if not in URL
  useEffect(() => {
    if (selectedYear === null) {
      setYear(new Date().getFullYear())
    }
  }, [selectedYear, setYear])
}
```

### Resetting Filters

Reset all filters to defaults:

```typescript
const reset = useEmbedFilters((state) => state.reset)

<button onClick={() => reset()}>Reset alle filters</button>
```

Preserve specific filters when resetting:

```typescript
reset({ selectedYear: 2024 })  // Reset all except year
```

### Export for Embeds

Get current state as query string for embed URLs:

```typescript
const toQueryString = useEmbedFilters((state) => state.toQueryString)

const embedUrl = `/embed/analysis/section/?${toQueryString()}`
// → /embed/analysis/section/?year=2024&sector=F&view=chart
```

## Migration Guide

### From useState to Store

**Before:**

```typescript
const [selectedYear, setSelectedYear] = useState(2024)
const [selectedSector, setSelectedSector] = useState<string | null>(null)

<ExportButtons
  slug="analysis"
  sectionId="section"
  viewType="chart"
  embedParams={{ selectedYear, selectedSector }}  // Manual
/>
```

**After:**

```typescript
useInitializeFilters()

const selectedYear = useEmbedFilters((state) => state.selectedYear)
const setYear = useEmbedFilters((state) => state.setYear)
const selectedSector = useEmbedFilters((state) => state.selectedSector)
const setSector = useEmbedFilters((state) => state.setSector)

<ExportButtons
  slug="analysis"
  sectionId="section"
  viewType="chart"
  // No embedParams needed - automatic!
/>
```

### From GeoContext to Store

The store can coexist with GeoContext during migration. Eventually GeoContext can be deprecated in favor of `useGeoFilters()`.

**Migration path:**

1. Keep GeoContext for non-migrated analyses
2. Use store for migrated analyses
3. Once all analyses migrated, remove GeoContext

## DevTools Integration

Store is integrated with Redux DevTools (if extension installed):

1. Open Redux DevTools in browser
2. Select "EmbedFilters" store
3. Inspect state changes
4. Time-travel through filter states
5. Export/import state snapshots

## Performance Considerations

### Selective Subscriptions

Use selector functions to subscribe only to needed state:

```typescript
// ✅ Good - only re-renders when year changes
const selectedYear = useEmbedFilters((state) => state.selectedYear)

// ❌ Bad - re-renders on ANY state change
const store = useEmbedFilters()
const selectedYear = store.selectedYear
```

### Batched Updates

Multiple state changes are batched automatically by Zustand:

```typescript
// These trigger only ONE re-render
setYear(2024)
setSector('F')
setProvince('10000')
```

## Testing

### Unit Tests

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

### E2E Tests

See `tests/e2e/url-sync.spec.ts` for comprehensive E2E tests.

## Troubleshooting

### Filters not loading from URL

1. Check `useInitializeFilters()` is called
2. Verify URL params match expected format
3. Check browser console for errors

### URL not updating

1. Ensure `syncToUrl()` is called in setter
2. Check browser history API is available
3. Verify not in SSR context

### Multiple instances conflicting

Store is global - multiple instances share state. If isolation needed:

1. Use different URL param names per analysis
2. Or scope state by `analysisSlug`
3. Or create separate stores per analysis

## Future Enhancements

- [ ] Local storage persistence (optional)
- [ ] URL compression for complex filter states
- [ ] Filter presets/bookmarks
- [ ] Cross-analysis filter synchronization
- [ ] Server-side URL param rendering
```

### 5.3 Create Migration Tracking

**File:** `docs/workflows/WF-url-sync-migration-status.md`

```markdown
---
kind: workflow-status
title: URL Sync Migration Status
slug: url-sync-migration-status
parent: WF-url-synced-state-implementation.md
updated: 2026-01-22
---

# URL Sync Migration Status

Track migration progress for all 16 analyses.

## Legend

- ✅ Complete - Fully migrated and tested
- 🚧 In Progress - Migration started
- ⏳ Planned - Not started
- ❌ Blocked - Issue preventing migration

## Analysis Status

### Phase 1: Proof of Concept

| Analysis | Status | Dashboard | Embed | Tests | Notes |
|----------|--------|-----------|-------|-------|-------|
| faillissementen | ✅ | ✅ | ✅ | ✅ | Reference implementation |

### Phase 3.1: Simple Analyses

| Analysis | Status | Dashboard | Embed | Tests | Notes |
|----------|--------|-----------|-------|-------|-------|
| gebouwenpark | ⏳ | ⏳ | ⏳ | ⏳ | - |
| huishoudensgroei | ⏳ | ⏳ | ⏳ | ⏳ | - |
| prijsherziening-index-i-2021 | ⏳ | ⏳ | ⏳ | ⏳ | - |

### Phase 3.2: Medium Complexity

| Analysis | Status | Dashboard | Embed | Tests | Notes |
|----------|--------|-----------|-------|-------|-------|
| vergunningen-aanvragen | ⏳ | ⏳ | ⏳ | ⏳ | - |
| vergunningen-goedkeuringen | ⏳ | ⏳ | ⏳ | ⏳ | Period comparisons |
| vastgoed-verkopen | ⏳ | ⏳ | ⏳ | ⏳ | Property type filter |
| starters-stoppers | ⏳ | ⏳ | ⏳ | ⏳ | Survival horizon |
| energiekaart-premies | ⏳ | ⏳ | ⏳ | ⏳ | Measure type |

### Phase 3.3: Complex Analyses

| Analysis | Status | Dashboard | Embed | Tests | Notes |
|----------|--------|-----------|-------|-------|-------|
| gemeentelijke-investeringen | ⏳ | ⏳ | ⏳ | ⏳ | BV/REK perspectives |
| bouwprojecten-gemeenten | ⏳ | ⏳ | ⏳ | ⏳ | Search, sorting, chunked data |
| bouwondernemers | ⏳ | ⏳ | ⏳ | ⏳ | Multiple breakdowns |
| betaalbaar-arr | ⏳ | ⏳ | ⏳ | ⏳ | Cross-analysis |
| silc-energie-2023 | ⏳ | ⏳ | ⏳ | ⏳ | Income, tenure |

## Component Migration

| Component | Status | Notes |
|-----------|--------|-------|
| ExportButtons | ✅ | Remove embedParams, use toQueryString() |
| AnalysisSection | ⏳ | Replace local view state |
| TimeSeriesSection | ⏳ | Replace local view state |
| GeoFilter | ⏳ | Migrate to useGeoFilters() |
| FilterableChart | ⏳ | No changes needed |
| FilterableTable | ⏳ | No changes needed |
| MunicipalityMap | ⏳ | No changes needed |

## Testing Coverage

| Test Type | Coverage | Target | Status |
|-----------|----------|--------|--------|
| Unit Tests | 0/16 | 16/16 | ⏳ |
| E2E Tests | 0/16 | 16/16 | ⏳ |
| Manual Tests | 1/16 | 16/16 | 🚧 |

## Known Issues

None yet.

## Timeline

- **Day 1 PM:** Complete Phase 1 (Faillissementen PoC)
- **Day 2 AM:** Complete Phase 2 (Shared components)
- **Day 2 PM:** Complete Phase 3.1 (Simple analyses)
- **Day 3 AM:** Complete Phase 3.2 (Medium complexity)
- **Day 3 PM:** Complete Phase 3.3 (Complex analyses)
- **Day 4:** Enhanced features (history, analytics, presets)
- **Day 5:** Testing & documentation
```

---

## Phase 6: Deployment & Rollout (Day 5 Afternoon)

### 6.1 Pre-Deployment Checklist

- [ ] All analyses migrated
- [ ] All tests passing
- [ ] Documentation complete
- [ ] No console errors/warnings
- [ ] Performance profiling done
- [ ] Bundle size acceptable (+3KB for Zustand is OK)

### 6.2 Deployment Strategy

**Option A: Big Bang (All at once)**
- Deploy all changes together
- Higher risk but faster completion
- Recommended if thorough testing done

**Option B: Gradual Rollout**
- Deploy analyses in batches
- Monitor each batch for issues
- Lower risk but slower

**Recommended: Option A** (backward compatible, low risk)

### 6.3 Post-Deployment Monitoring

Monitor for 48 hours:

1. **Error Tracking**
   - Check browser console errors
   - Monitor Sentry/error service (if integrated)
   - Watch GitHub Issues for user reports

2. **Analytics**
   - Track filter change events
   - Monitor embed usage
   - Check URL sharing patterns

3. **Performance**
   - Page load times
   - Time to interactive
   - Bundle size impact

### 6.4 Rollback Plan

If critical issues arise:

1. **Hotfix Option:**
   ```typescript
   // In embed-filters-store.ts
   export const ENABLE_URL_SYNC = false  // Feature flag

   syncToUrl: () => {
     if (!ENABLE_URL_SYNC) return  // Disable sync
     // ...
   }
   ```

2. **Full Rollback:**
   ```bash
   git revert <commit-hash>
   npm run build
   # Deploy previous version
   ```

3. **Analysis-Specific Rollback:**
   - Revert individual dashboard to `useState`
   - Keep other analyses on new system
   - Isolate problematic analysis

---

## Success Metrics

### Technical Metrics

- [ ] **Bundle Size:** <5KB increase (Zustand is ~3KB)
- [ ] **Performance:** No regression in Time to Interactive
- [ ] **Test Coverage:** 100% of analyses tested
- [ ] **Error Rate:** <0.1% of page views

### User Experience Metrics

- [ ] **URL Sharing:** >10% of users use share button
- [ ] **Embed Accuracy:** 100% of embeds show correct filtered state
- [ ] **Filter Persistence:** 95%+ of refreshes preserve filters
- [ ] **Browser Navigation:** Back/forward works for all filters

### Developer Experience Metrics

- [ ] **Time to Add Filter:** <5 minutes (vs 15+ minutes before)
- [ ] **Code Duplication:** 80% reduction in manual `embedParams`
- [ ] **Documentation Clarity:** 90%+ of team understands system

---

## Risk Assessment

### Low Risk ✅

- **Backward Compatibility:** Store coexists with existing `useState`
- **Opt-In Migration:** Analyses migrate one at a time
- **Feature Flags:** Can disable URL sync if needed
- **Testing:** Comprehensive E2E test suite

### Medium Risk ⚠️

- **Bundle Size:** +3KB may affect mobile performance slightly
  - *Mitigation:* Zustand is tiny, well worth trade-off
- **URL Length:** Complex filter states create long URLs
  - *Mitigation:* Short param names, most filters optional
- **Browser Compatibility:** History API not available in very old browsers
  - *Mitigation:* Graceful degradation, localStorage fallback

### High Risk ❌

None identified.

---

## Appendix A: Code Snippets Reference

### A.1 Standard Dashboard Migration Pattern

```typescript
// BEFORE
import { useState } from 'react'

export function MyDashboard() {
  const [selectedYear, setSelectedYear] = useState(2024)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'chart' | 'table' | 'map'>('chart')

  return (
    <div>
      <Filters
        year={selectedYear}
        onYearChange={setSelectedYear}
        sector={selectedSector}
        onSectorChange={setSelectedSector}
      />
      <ExportButtons
        slug="my-analysis"
        sectionId="overview"
        viewType={currentView}
        embedParams={{ selectedYear, selectedSector }}
      />
    </div>
  )
}

// AFTER
import { useEmbedFilters, useInitializeFilters } from '@/lib/stores/embed-filters-store'

export function MyDashboard() {
  useInitializeFilters()

  const selectedYear = useEmbedFilters((state) => state.selectedYear)
  const setYear = useEmbedFilters((state) => state.setYear)
  const selectedSector = useEmbedFilters((state) => state.selectedSector)
  const setSector = useEmbedFilters((state) => state.setSector)
  const currentView = useEmbedFilters((state) => state.currentView)

  // Set defaults
  useEffect(() => {
    if (selectedYear === null) setYear(2024)
  }, [selectedYear, setYear])

  return (
    <div>
      <Filters
        year={selectedYear}
        onYearChange={setYear}
        sector={selectedSector}
        onSectorChange={setSector}
      />
      <ExportButtons
        slug="my-analysis"
        sectionId="overview"
        viewType={currentView}
        {/* No embedParams! */}
      />
    </div>
  )
}
```

### A.2 Embed Component Migration Pattern

```typescript
// BEFORE
export function MyEmbed({ section }: { section: string }) {
  const params = getParamsFromUrl()
  const [selectedYear, setSelectedYear] = useState(params.year || 2024)

  return <Chart year={selectedYear} />
}

// AFTER
import { useEmbedFilters, useInitializeFilters } from '@/lib/stores/embed-filters-store'

export function MyEmbed({ section }: { section: string }) {
  useInitializeFilters()

  const selectedYear = useEmbedFilters((state) => state.selectedYear)
  const setYear = useEmbedFilters((state) => state.setYear)

  // Set default
  useEffect(() => {
    if (selectedYear === null) setYear(2024)
  }, [selectedYear, setYear])

  return <Chart year={selectedYear} />
}
```

---

## Appendix B: URL Parameter Reference

Complete mapping of store state to URL parameters:

| Store Property | URL Param | Type | Example |
|----------------|-----------|------|---------|
| `selectedYear` | `year` | number | `?year=2024` |
| `selectedQuarter` | `q` | number (1-4) | `?q=3` |
| `selectedMonth` | `month` | number (1-12) | `?month=6` |
| `timeRange` | `range` | string | `?range=monthly` |
| `startYear` | `start` | number | `?start=2020` |
| `endYear` | `end` | number | `?end=2024` |
| `selectedRegion` | `region` | string | `?region=2000` |
| `selectedProvince` | `province` | string | `?province=10000` |
| `selectedMunicipality` | `municipality` | string | `?municipality=11001` |
| `geoLevel` | `geoLevel` | string | `?geoLevel=province` |
| `selectedSector` | `sector` | string | `?sector=F` |
| `selectedCategory` | `category` | string | `?category=renovatie` |
| `selectedSubcategory` | `subcategory` | string | `?subcategory=dak` |
| `currentView` | `view` | string | `?view=map` |
| `currentChartType` | `chartType` | string | `?chartType=line` |
| `showMovingAverage` | `ma` | boolean | `?ma=1` |
| `showProvinceBoundaries` | `boundaries` | boolean | `?boundaries=1` |
| `selectedDuration` | `duration` | string | `?duration=0-1` |
| `selectedWorkerCount` | `workers` | string | `?workers=1-4` |
| `selectedPropertyType` | `type` | string | `?type=house` |
| `stopHorizon` | `horizon` | number (1-5) | `?horizon=3` |
| `selectedMeasure` | `measure` | string | `?measure=aantal` |
| `selectedPerspective` | `perspective` | string | `?perspective=BV` |
| `selectedField` | `field` | string | `?field=01` |
| `selectedReportYear` | `reportYear` | number | `?reportYear=2026` |
| `selectedBudgetRange` | `budget` | string | `?budget=500k-1m` |
| `selectedProjectType` | `projectType` | string | `?projectType=nieuwbouw` |
| `sortBy` | `sort` | string | `?sort=amount-desc` |
| `selectedIncomeQuintile` | `income` | string | `?income=Q1` |
| `selectedTenureStatus` | `tenure` | string | `?tenure=owner` |

**Example Complex URL:**

```
https://gehuybre.github.io/data-blog/analyses/faillissementen/
?year=2024
&q=3
&sector=F
&province=10000
&view=map
&range=quarterly
&duration=0-1
```

---

## Conclusion

This implementation plan provides a comprehensive, phased approach to migrating from manual filter state management to a centralized Zustand store with automatic URL synchronization.

**Key Takeaways:**

1. **Low Risk:** Backward compatible, opt-in migration
2. **High Value:** Perfect embed sharing, URL persistence, better DX
3. **Fast Execution:** 3-5 days for full migration
4. **Future-Proof:** Enables history navigation, presets, analytics
5. **Well-Tested:** Comprehensive E2E test coverage

**Next Steps:**

1. Review and approve this plan
2. Install dependencies (`npm install zustand`)
3. Start Phase 1 (Faillissementen PoC)
4. Iterate based on learnings
5. Roll out to remaining analyses

**Questions or concerns?** Review risk assessment and mitigation strategies above.
