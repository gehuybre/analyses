---
kind: file
path: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenDashboard.tsx
role: UI Component
workflows: []
inputs:
  - name: stats_2025.json
    from: embuild-analyses/analyses/gebouwenpark/results/stats_2025.json
    type: json
    schema: Building stock statistics with snapshot and time series data
    required: true
outputs: []
interfaces:
  - GebouwenDashboard (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When gebouwenpark analysis is removed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/analyses/gebouwenpark/GebouwenDashboard.tsx

## Role

Main dashboard component for the Gebouwenpark analysis. Displays building stock statistics with interactive filters for building types and regions.

## Why it exists

Provides a comprehensive interactive interface for exploring Belgian building stock data, allowing users to filter by building type (closed-row, semi-detached, detached, apartments, etc.) and region (national, Flanders, Wallonia, Brussels).

## Used by workflows

None. This is a UI component used in the gebouwenpark analysis page.

## Inputs

Reads processed building statistics from `stats_2025.json` containing snapshot data and time series from 1995-2025.

## Outputs

Renders interactive dashboard with region and building type filters, KPI cards showing totals, and time series visualizations.

## Interfaces

Exports `GebouwenDashboard` React component that can be embedded in MDX content.

## Ownership and lifecycle

Stability: Stable, used in production.
Safe to delete when: The gebouwenpark analysis is removed or replaced.
Superseded by: None.
