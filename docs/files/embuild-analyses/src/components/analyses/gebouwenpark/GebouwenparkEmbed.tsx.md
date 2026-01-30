---
kind: file
path: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenparkEmbed.tsx
role: UI Component
workflows:
  - WF-embed-system
inputs:
  - name: stats_2025.json
    from: embuild-analyses/analyses/gebouwenpark/results/stats_2025.json
    type: json
    schema: Building stock statistics
    required: true
outputs: []
interfaces:
  - GebouwenparkEmbed (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When gebouwenpark embedding is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenparkEmbed.tsx

## Role

Embeddable iframe component for the Gebouwenpark analysis. Provides a standalone view of the building stock evolution time series.

## Why it exists

Allows external websites to embed the gebouwenpark evolution chart/table via iframe without the full page layout.

## Used by workflows

- [WF-embed-system](../../../../workflows/WF-embed-system.md): Used for iframe embedding

## Inputs

Reads building statistics from `stats_2025.json` to display time series data.

## Outputs

Renders a TimeSeriesSection with chart and table views showing evolution of buildings from 1995-2025.

## Interfaces

Exports `GebouwenparkEmbed` component accepting `section` prop (currently only "evolutie").

## Ownership and lifecycle

Stability: Stable, used for iframe embeds.
Safe to delete when: Gebouwenpark embedding is deprecated or replaced.
Superseded by: None.
