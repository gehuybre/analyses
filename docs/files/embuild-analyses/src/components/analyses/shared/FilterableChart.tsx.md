---
kind: file
path: embuild-analyses/src/components/analyses/shared/FilterableChart.tsx
role: UI Component
workflows:
  - WF-vergunningen-goedkeuringen
inputs:
  - name: data
    from: Props
    type: array
    schema: Data points
    required: true
  - name: metric
    from: Props
    type: string
    schema: string (key in data objects)
    required: true
outputs:
  - name: JSX
    to: React Tree
    type: component
    schema: React Element
interfaces:
  - FilterableChart
stability: experimental
owner: Unknown
safe_to_delete_when: No analyses use this shared component
superseded_by: null
last_reviewed: 2025-12-30
---

# File: embuild-analyses/src/components/analyses/shared/FilterableChart.tsx

## Role
Displays a composed chart with quarterly bars and a 4-quarter moving average line.

## Why it exists
To visualize the trend of the selected metric over time. It now uses the centralized `chart-theme.ts` and CSS variables to ensure consistency across the blog.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
Receives an array of data points and the metric key to visualize.

## Outputs
Renders a Recharts `ComposedChart`.

## Interfaces
- `FilterableChart`: React functional component.

## Ownership and lifecycle
Experimental shared component.
