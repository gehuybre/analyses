---
kind: file
path: embuild-analyses/src/components/analyses/energiekaart-premies/EnergiekaartChart.tsx
role: UI Component
workflows:
  - unknown
inputs:
  - name: data
    from: Props
    type: array
    schema: "{ jaar: number, value: number }[]"
    required: true
  - name: label
    from: Props
    type: string
    schema: Label for the bar series
    required: true
  - name: isCurrency
    from: Props
    type: boolean
    schema: Whether to format values as EUR
    required: false
outputs:
  - name: JSX
    to: React Tree
    type: component
    schema: React Element
interfaces:
  - EnergiekaartChart
stability: experimental
owner: Unknown
safe_to_delete_when: Analysis is removed
superseded_by: null
last_reviewed: 2025-12-30
---

# File: embuild-analyses/src/components/analyses/energiekaart-premies/EnergiekaartChart.tsx

## Role
Chart component for the Energiekaart Premies analysis.

## Why it exists
Visualizes trends of energy premiums over years. Customized to calculate a 4-year moving average and handle specific currency formatting. Now refactored to use the central `chart-theme.ts` for styling consistency.

## Used by workflows
- Unknown

## Inputs
Receives time-series data (year/value) and formatting options.

## Outputs
Renders a Recharts `ComposedChart`.

## Interfaces
- `EnergiekaartChart`: React functional component.

## Ownership and lifecycle
Experimental component specific to the Energiekaart analysis.
