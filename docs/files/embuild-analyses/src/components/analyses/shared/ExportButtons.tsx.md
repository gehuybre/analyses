---
kind: file
path: embuild-analyses/src/components/analyses/shared/ExportButtons.tsx
role: UI component for CSV download and embed code generation
workflows: []
inputs:
  - name: data
    from: parent component
    type: json
    schema: "Array of { label: string, value: number, periodCells?: Array<string|number> }"
    required: true
  - name: title
    from: parent component
    type: string
    schema: Section title for filename and embed
    required: true
  - name: slug
    from: parent component
    type: string
    schema: Analysis slug (e.g., "vergunningen-goedkeuringen")
    required: true
  - name: sectionId
    from: parent component
    type: string
    schema: Section identifier (e.g., "renovatie")
    required: true
outputs:
  - name: CSV file
    to: browser download
    type: file
    schema: CSV with period columns and value
  - name: Embed code
    to: clipboard
    type: string
    schema: HTML iframe snippet
interfaces:
  - ExportButtons (React component)
stability: stable
owner: Unknown
safe_to_delete_when: No longer needed for data export functionality
superseded_by: null
last_reviewed: 2025-12-25
---

# File: embuild-analyses/src/components/analyses/shared/ExportButtons.tsx

## Role

Provides two export actions for analysis sections: CSV data download and iframe embed code copy. Renders as a pair of small buttons that appear in the section header.

## Why it exists

Users need to share and reuse visualizations. CSV download enables data analysis in external tools. Embed code allows integration of live charts/tables/maps into external websites via iframe.

## Used by workflows

Not directly tied to a workflow. Used by dashboard components.

## Inputs

- **data**: Aggregated data array from the parent section. Must have `label`, `value`, and optionally `periodCells` for multi-column CSV export.
- **title**: Section title used in the CSV filename and iframe title attribute.
- **slug**: Analysis slug for constructing the embed URL path.
- **sectionId**: Section identifier for constructing the embed URL path.
- **viewType**: Current view ("chart", "table", or "map") for the embed URL query parameter.
- **periodHeaders**: Column headers for the CSV (defaults to ["Jaar", "Kwartaal"]).
- **valueLabel**: Header for the value column (defaults to "Aantal").

## Outputs

- **CSV file**: Downloaded file named `{slug}-{sectionId}-{viewType}.csv` containing period data and values.
- **Embed code**: Iframe HTML copied to clipboard, pointing to `/embed/{slug}/{sectionId}/?view={viewType}`.

## Interfaces

- `ExportButtons`: React component accepting props described above.

## Ownership and lifecycle

Stable component. Can be deleted when export functionality is no longer needed. No superseding component planned.
