---
kind: workflow
id: WF-embed-system
name: Iframe Embed System
slug: embed-system
status: active
owner: Unknown
trigger: manual
last_reviewed: 2026-01-17
files:
  - embuild-analyses/src/lib/embed-config.ts
  - embuild-analyses/src/app/embed/[slug]/[section]/page.tsx
  - embuild-analyses/src/app/embed/[slug]/[section]/EmbedClient.tsx
  - embuild-analyses/src/components/analyses/shared/ExportButtons.tsx
inputs:
  - EMBED_CONFIGS in src/lib/embed-config.ts
  - Analysis data in analyses/*/results/*.json
outputs:
  - Static embed pages at /embed/[slug]/[section]
  - Embed iframe code via ExportButtons component
technologies:
  - Next.js static export
  - Dynamic imports
  - URL query parameters
---

# Iframe Embed System

## Overview

The embed system allows analysis visualizations to be embedded in external websites via iframes. It provides a centralized configuration approach that makes it easy to add new embeddable sections without code duplication.

## Architecture

### Core Components

1. **`src/lib/embed-config.ts`** - Centralized configuration registry
2. **`src/app/embed/[slug]/[section]/page.tsx`** - Next.js route handler
3. **`src/app/embed/[slug]/[section]/EmbedClient.tsx`** - Client-side embed renderer
4. **`src/components/analyses/shared/ExportButtons.tsx`** - UI for generating embed code

### Embed Types

**Standard Embeds** (config-based):
- Declarative configuration in `embed-config.ts`
- Automatic data loading
- Uses `EmbeddableSection` component
- Best for simple visualizations with consistent data structure

**Custom Embeds** (component-based):
- Custom React component implementation
- Full control over rendering and data loading
- Best for complex visualizations with unique requirements
- Example: `StartersStoppersEmbed`

## How It Works

### 1. Configuration (`embed-config.ts`)

All embeddable sections are defined in `EMBED_CONFIGS`:

```typescript
{
  slug: "analysis-slug",
  sections: {
    "section-id": {
      type: "standard",
      title: "Display Title",
      dataPath: "analysis-slug/results/data.json",
      municipalitiesPath: "analysis-slug/results/municipalities.json",
      metric: "metric_key",
      label: "Metric Label"
    }
  }
}
```

### 2. Static Site Generation

- `getAllEmbedParams()` generates all embed routes for Next.js
- Each route is pre-rendered during `next build`
- Static HTML files are created at `/embed/[slug]/[section]/`

### 3. Data Loading

**Standard Embeds:**
- Data paths from config are used for dynamic imports
- Data loaded client-side via `import()` statements
- Loading/error states handled automatically

**Custom Embeds:**
- Component manages its own data loading
- Direct imports in the component file

### 4. URL Parameters

Embeds support URL query parameters for customization:

- `view` - Visualization type: `chart`, `table`, or `map`
- `horizon` - Time horizon (for starters-stoppers): `1` to `5`
- `region` - Region code for filtering
- `province` - Province code for filtering
- `sector` - NACE sector code for filtering

Example: `/embed/starters-stoppers/starters/?view=chart&horizon=3&province=10000`

### 5. Embed Code Generation

The `ExportButtons` component:
1. Validates section is embeddable via `isEmbeddable(slug, sectionId)`
2. Builds embed URL with current view type and parameters
3. Generates HTML iframe code with proper attributes
4. Provides copy-to-clipboard functionality

## Adding a New Embeddable Section

### Standard Embed (Simple)

1. Add entry to `EMBED_CONFIGS` in `src/lib/embed-config.ts`:

```typescript
{
  slug: "new-analysis",
  sections: {
    "new-section": {
      type: "standard",
      title: "Section Title",
      dataPath: "new-analysis/results/data.json",
      municipalitiesPath: "new-analysis/results/municipalities.json",
      metric: "value_field",
      label: "Value Label"
    }
  }
}
```

2. Ensure data files exist in `analyses/new-analysis/results/`
3. Add `ExportButtons` to your analysis component:

```tsx
<ExportButtons
  data={chartData}
  title="Section Title"
  slug="new-analysis"
  sectionId="new-section"
  viewType={currentView}
/>
```

4. Build and deploy - embed route is automatically generated!

### Custom Embed (Advanced)

1. Create custom embed component in `src/components/analyses/[analysis]/[Component]Embed.tsx`
2. Add entry to `EMBED_CONFIGS`:

```typescript
{
  slug: "analysis-slug",
  sections: {
    "section-id": {
      type: "custom",
      title: "Section Title",
      component: "ComponentEmbed"
    }
  }
}
```

3. Register component in `EmbedClient.tsx`:

```typescript
if (config.type === "custom" && config.component === "ComponentEmbed") {
  return <ComponentEmbed {...props} />
}
```

## Data Requirements

For standard embeds, data files must follow this structure:

**Data file** (`data.json`):
```json
[
  {
    "m": 11001,    // Municipality code
    "y": 2024,     // Year
    "q": 1,        // Quarter
    "metric": 123  // Metric value
  }
]
```

**Municipalities file** (`municipalities.json`):
```json
[
  {
    "code": 11001,
    "name": "Municipality Name"
  }
]
```

## Deployment Considerations

### basePath Handling

The system automatically handles GitHub Pages `basePath`:
- Development: No basePath
- Production: `/data-blog` prefix

This is handled in:
- `ExportButtons.tsx` - Embed URL generation
- `EmbeddableSection.tsx` - Footer link
- `StartersStoppersEmbed.tsx` - Footer link

### Static Export

All embed routes must be defined at build time via `generateStaticParams()`. This is why centralized configuration is critical - it ensures all routes are discovered during the build process.

### Bundle Size & Data Loading Strategy

**Current Approach: Synchronous Registry**

The embed system uses a **synchronous data registry** (`embed-data-registry.ts`) with explicit imports rather than dynamic imports. This design decision prioritizes:

1. **Build-time validation**: All data paths are validated by the bundler at compile time
2. **Type safety**: TypeScript can verify data structures during development
3. **Reliability**: No runtime import failures due to misconfigured paths
4. **Next.js static export compatibility**: Works seamlessly with static site generation

**Trade-offs:**

- **Pros**:
  - Bundler (webpack/vite) can properly analyze and optimize the dependency graph
  - No runtime failures from dynamic import path construction
  - Better tree-shaking opportunities
  - Simpler error handling (errors occur at build time, not runtime)

- **Cons**:
  - All embed data is included in the initial JavaScript bundle
  - Bundle size grows proportionally with number of embeds
  - No lazy loading of individual embed data

**When to Reconsider:**

If the number of embeds grows significantly (>20 sections) or individual data files become very large (>500KB), consider:

1. **Code splitting by analysis**: Create separate bundles per analysis slug
2. **True dynamic imports**: Use dynamic imports with explicit path allowlists for the bundler
3. **Server-side rendering**: Move away from static export to enable runtime data fetching
4. **External data storage**: Host large JSON files separately and fetch via HTTP

For the current scale (2-5 analyses, modest data files), the synchronous registry approach is the optimal balance of reliability, maintainability, and performance.

### Cross-Origin Considerations

Iframes work cross-origin by default. Key considerations:
- Embeds are read-only (no forms/mutations)
- No cookies or localStorage needed
- Static files served via GitHub Pages
- CORS not required for iframe content

## Troubleshooting

### Embed not showing

1. Check if section is in `EMBED_CONFIGS`
2. Verify data files exist at specified paths
3. Check browser console for import errors
4. Verify route was generated during build

### Data not loading

1. Check data file paths in config are correct
2. Verify JSON files are valid
3. Check for dynamic import errors in browser console
4. Ensure municipality codes match between files

### URL parameters not working

1. Verify parameters are added to `embedParams` in `ExportButtons`
2. Check `getParamsFromUrl()` in `EmbedClient.tsx` handles your parameter
3. Ensure URL encoding is correct

## Future Enhancements

Potential improvements:
- Theme parameter (light/dark mode)
- Language parameter (NL/FR/EN)
- Custom color schemes
- Responsive height parameter
- Export to PNG/SVG from embed
- Analytics/tracking for embeds
