---
kind: file
path: embuild-analyses/src/components/analyses/shared/EmbeddableSection.tsx
role: Standalone section renderer for iframe embeds
workflows: []
inputs:
  - name: data
    from: embed page
    type: json
    schema: Raw data array with municipality-level records
    required: true
  - name: municipalities
    from: embed page
    type: json
    schema: Municipality lookup array
    required: true
  - name: metric
    from: embed page
    type: string
    schema: Metric key to display
    required: true
  - name: viewType
    from: URL query param
    type: string
    schema: "chart | table | map"
    required: true
outputs:
  - name: Rendered visualization
    to: browser
    type: html
    schema: Chart, table, or map visualization
interfaces:
  - EmbeddableSection (React component)
stability: stable
owner: Unknown
safe_to_delete_when: Embed functionality is removed
superseded_by: null
last_reviewed: 2025-12-25
---

# File: embuild-analyses/src/components/analyses/shared/EmbeddableSection.tsx

## Role

Renders a single visualization (chart, table, or map) for use in an iframe embed. A simplified version of AnalysisSection without tabs or geo filtering context.

## Why it exists

Iframe embeds need a minimal, standalone component that renders just the requested visualization type without the full dashboard UI. This component provides that minimal wrapper.

## Used by workflows

Not directly tied to a workflow. Used by the embed route pages.

## Inputs

- **title**: Section title displayed above the visualization.
- **data**: Raw data array containing municipality-level records.
- **municipalities**: Municipality lookup data for map rendering.
- **metric**: The metric key to aggregate and display.
- **viewType**: Which visualization to render ("chart", "table", or "map").
- **label**: Optional label for the value column in tables.
- **period**: Optional custom period configuration for non-quarterly data.

## Outputs

Renders the requested visualization type with the aggregated data, plus a footer link back to the main Data Blog site.

## Interfaces

- `EmbeddableSection<TData>`: Generic React component.

## Ownership and lifecycle

Stable component. Depends on FilterableChart, FilterableTable, and MunicipalityMap. Can be deleted when embed functionality is removed.
