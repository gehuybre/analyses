---
kind: file
path: embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx
role: UI Component
workflows:
  - WF-vergunningen-goedkeuringen
inputs:
  - name: title
    from: Props
    type: string
    schema: Section title
    required: true
  - name: data
    from: Props
    type: array
    schema: Data points
    required: true
  - name: municipalities
    from: Props
    type: array
    schema: Municipality list
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
  - AnalysisSection
stability: experimental
owner: Unknown
safe_to_delete_when: No analyses use this shared component
superseded_by: null
last_reviewed: 2025-12-14
---

# File: embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx

## Role
A container component that manages the state and layout for a single analysis section (e.g., "Renovatie" or "Nieuwbouw").

## Why it exists
To provide a consistent layout and filtering logic across different analysis sections. It integrates with `GeoContext` to filter data based on global selection.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
Receives title, data, municipality list, and the metric key ("ren" or "new") via props. Consumes `GeoContext`.

## Outputs
Renders a section with a title and tabs to switch between Chart, Table, and Map views. The content is filtered based on the global geographical context.

## Interfaces
- `AnalysisSection`: React functional component.

## Ownership and lifecycle
Experimental shared component.
