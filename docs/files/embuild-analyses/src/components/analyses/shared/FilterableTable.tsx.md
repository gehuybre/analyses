---
kind: file
path: embuild-analyses/src/components/analyses/shared/FilterableTable.tsx
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
  - name: label
    from: Props
    type: string
    schema: Label for the metric (e.g. "Aantal")
    required: false
outputs:
  - name: JSX
    to: React Tree
    type: component
    schema: React Element
interfaces:
  - FilterableTable
stability: experimental
owner: Unknown
safe_to_delete_when: No analyses use this shared component
superseded_by: null
last_reviewed: 2025-12-13
---

# File: embuild-analyses/src/components/analyses/shared/FilterableTable.tsx

## Role
Displays the analysis data in a tabular format.

## Why it exists
To provide a detailed view of the data values.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
Receives an array of data points and the metric key to display.

## Outputs
Renders a shadcn/ui `Table`.

## Interfaces
- `FilterableTable`: React functional component.

## Ownership and lifecycle
Experimental shared component.
