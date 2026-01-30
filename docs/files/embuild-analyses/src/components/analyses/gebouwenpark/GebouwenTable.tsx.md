---
kind: file
path: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenTable.tsx
role: UI Component
workflows: []
inputs: []
outputs: []
interfaces:
  - GebouwenTable (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When gebouwenpark table view is removed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenTable.tsx

## Role

Table component for displaying building stock time series data in tabular format.

## Why it exists

Provides an alternative tabular view of building stock data, complementing the chart visualization. Data is sorted by year in descending order for easy reading of recent trends.

## Used by workflows

None. This is a presentational component used by GebouwenDashboard and GebouwenparkEmbed.

## Inputs

Accepts `data` prop containing array of year/total/residential data points, plus optional labels and column visibility flags.

## Outputs

Renders a formatted table with year, total buildings, and residential buildings columns.

## Interfaces

Exports `GebouwenTable` component with props: data, totalLabel, residentialLabel, showBothColumns.

## Ownership and lifecycle

Stability: Stable, reusable table component.
Safe to delete when: Gebouwenpark table views are removed.
Superseded by: None.
