---
kind: file
path: embuild-analyses/src/lib/embed-config.ts
role: Configuration Registry
workflows:
  - WF-embed-system
inputs:
  - None (configuration only)
outputs:
  - Static params for Next.js routes
  - Configuration for EmbedClient component
interfaces:
  - getEmbedConfig (function)
  - getAllEmbedParams (function)
  - isEmbeddable (function)
stability: stable
owner: Unknown
safe_to_delete_when: When embed system is replaced with a different embed registry
superseded_by: null
last_reviewed: 2026-01-25
technologies:
  - TypeScript
  - Next.js static export
---

# embed-config.ts

## Purpose

This file serves as the **single source of truth** for all embeddable analysis sections across the entire application. It eliminates code duplication and makes adding new embeds trivial.

## Key Exports

### `EMBED_CONFIGS`

The main configuration array. Each entry represents an analysis with one or more embeddable sections.

**Structure:**
```typescript
{
  slug: string              // Analysis identifier
  sections: {
    [sectionId: string]: {
      type: "standard" | "custom"
      title: string
      // ... type-specific fields
    }
  }
}
```

### Embed Types

**Standard Embed:**
```typescript
{
  type: "standard"
  title: string                      // Display title
  dataPath: string                   // Path to JSON data (relative to analyses/)
  municipalitiesPath: string         // Path to municipalities JSON
  metric: string                     // Data field to visualize
  label?: string                     // Optional metric label
}
```

**Custom Embed:**
```typescript
{
  type: "custom"
  title: string                      // Display title
  component: string                  // Component name (must be registered)
}
```

### Helper Functions

**`getEmbedConfig(slug, section)`**
- Returns configuration for specific analysis/section
- Returns `null` if not found

**`getAllEmbedParams()`**
- Returns array of all `{slug, section}` pairs
- Used by Next.js `generateStaticParams()`

**`isEmbeddable(slug, section)`**
- Boolean check if section can be embedded
- Used by `ExportButtons` for validation

## Usage

### Adding a Standard Embed

1. Add configuration to `EMBED_CONFIGS`:

```typescript
{
  slug: "my-analysis",
  sections: {
    "my-section": {
      type: "standard",
      title: "My Analysis Section",
      dataPath: "my-analysis/results/data.json",
      municipalitiesPath: "my-analysis/results/municipalities.json",
      metric: "value",
      label: "Count"
    }
  }
}
```

2. That's it! The embed route is automatically generated.

### Adding a Custom Embed

1. Create component: `src/components/analyses/my-analysis/MyEmbed.tsx`

2. Add configuration:

```typescript
{
  slug: "my-analysis",
  sections: {
    "custom-section": {
      type: "custom",
      title: "Custom Section",
      component: "MyEmbed"
    }
  }
}
```

3. Register in `EmbedClient.tsx`:

```typescript
if (config.type === "custom" && config.component === "MyEmbed") {
  return <MyEmbed {...props} />
}
```

## Design Decisions

### Why Centralized Configuration?

**Before:** Each analysis required manual changes in 3+ files:
- `generateStaticParams()` in page.tsx
- Data imports in EmbedClient.tsx
- Configuration object in EmbedClient.tsx

**After:** Single entry in `EMBED_CONFIGS`, everything auto-generated.

### Why Two Embed Types?

- **Standard**: 90% of use cases - simple visualizations with consistent data structure
- **Custom**: Complex cases requiring unique logic (e.g., starters-stoppers with sector filtering)

### Dynamic Imports

Standard embeds use dynamic imports to avoid bundling all analysis data in one chunk:

```typescript
import(`../../../../../analyses/${config.dataPath}`)
```

This keeps the initial bundle small and loads data only when needed.

## Related Files

- `src/app/embed/[slug]/[section]/page.tsx` - Uses `getAllEmbedParams()`
- `src/app/embed/[slug]/[section]/EmbedClient.tsx` - Uses `getEmbedConfig()`
- `src/components/analyses/shared/ExportButtons.tsx` - Uses `isEmbeddable()`

## Future Improvements

Potential enhancements:
- Support for multiple data sources per embed
- Theming configuration (colors, fonts)
- Default view type configuration
- Custom height/aspect ratio settings
- Analytics/tracking configuration
