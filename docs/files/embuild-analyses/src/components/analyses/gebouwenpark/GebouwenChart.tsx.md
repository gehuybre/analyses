---
kind: file
path: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenChart.tsx
role: UI Component
workflows: []
inputs: []
outputs: []
interfaces:
  - GebouwenChart (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When gebouwenpark visualization is removed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenChart.tsx

## Role

Line chart component for visualizing building stock time series data using Recharts.

## Why it exists

Provides a reusable chart component for displaying total and residential building counts over time with formatted axis labels and tooltips.

## Used by workflows

None. This is a presentational component used by GebouwenDashboard and GebouwenparkEmbed.

## Inputs

Accepts `data` prop containing array of year/total/residential data points, plus optional labels and display flags.

## Outputs

Renders a responsive line chart with dual lines for total buildings and residential buildings.

## Interfaces

Exports `GebouwenChart` component with props: data, totalLabel, residentialLabel, showBothLines.

## Ownership and lifecycle

Stability: Stable, reusable chart component.
Safe to delete when: Gebouwenpark visualizations are removed.
Superseded by: None.
