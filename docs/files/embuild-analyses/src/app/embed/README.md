---
kind: file
path: embuild-analyses/src/app/embed
role: Embed route for iframe integration
workflows: []
inputs:
  - name: slug
    from: URL path
    type: string
    schema: Analysis slug (e.g., "vergunningen-goedkeuringen")
    required: true
  - name: section
    from: URL path
    type: string
    schema: Section identifier (e.g., "renovatie")
    required: true
  - name: view
    from: URL query param
    type: string
    schema: "chart | table | map (defaults to chart)"
    required: false
outputs:
  - name: Embedded visualization
    to: browser
    type: html
    schema: Standalone visualization page for iframe
interfaces:
  - /embed/[slug]/[section]/ (Next.js route)
stability: stable
owner: Unknown
safe_to_delete_when: Embed functionality is removed
superseded_by: null
last_reviewed: 2025-12-25
---

# File: embuild-analyses/src/app/embed

## Role

Provides standalone pages for embedding visualizations via iframe. Each page renders a single chart, table, or map without the full site navigation.

## Why it exists

External websites need to embed visualizations from the Data Blog. This route provides minimal, standalone pages suitable for iframe integration.

## Structure

```
embed/
├── layout.tsx              # Minimal layout without site navigation
└── [slug]/
    └── [section]/
        ├── page.tsx        # Server component with generateStaticParams
        └── EmbedClient.tsx # Client component with view type handling
```

## Used by workflows

Not directly tied to a workflow. Used by ExportButtons for generating embed URLs.

## Configuration

To add new embeddable sections:

1. Add the section config to `EmbedClient.tsx` in `EMBED_CONFIGS`:
   ```typescript
   "analysis-slug": {
     "section-id": {
       title: "Section Title",
       data: importedData,
       municipalities: importedMunicipalities,
       metric: "metricKey",
       label: "Value Label",
     },
   },
   ```

2. Add the static params to `page.tsx` in `generateStaticParams`:
   ```typescript
   { slug: "analysis-slug", section: "section-id" },
   ```

## URL Format

```
/embed/{slug}/{section}/?view={chart|table|map}
```

Examples:
- `/embed/vergunningen-goedkeuringen/renovatie/?view=chart`
- `/embed/vergunningen-goedkeuringen/nieuwbouw/?view=table`

## Limitations

- Static export means sections must be pre-defined in `generateStaticParams`
- View type is read client-side from URL query params
- Complex dashboards with custom aggregation (like starters-stoppers) are not supported for embedding due to their filter-dependent data processing

## Ownership and lifecycle

Stable route. Can be deleted when embed functionality is no longer needed.
