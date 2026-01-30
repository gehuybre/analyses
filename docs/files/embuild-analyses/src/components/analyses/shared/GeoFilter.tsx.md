---
kind: file
path: embuild-analyses/src/components/analyses/shared/GeoFilter.tsx
role: UI Component
workflows:
  - WF-vergunningen-goedkeuringen
inputs:
  - name: municipalities
    from: Props
    type: array
    schema: List of available municipalities
    required: true
outputs:
  - name: JSX
    to: React Tree
    type: component
    schema: React Element
interfaces:
  - GeoFilter
stability: experimental
owner: Unknown
safe_to_delete_when: Geographical filtering is no longer needed
superseded_by: null
last_reviewed: 2025-12-30
---

# File: embuild-analyses/src/components/analyses/shared/GeoFilter.tsx

## Role
A UI component that allows users to select a geographical level (Region, Province, Municipality) and specific entities within that level.

## Why it exists
To provide a user interface for controlling the global geographical filter state managed by `GeoContext`. It now uses standard semantic classes for layout and styling (e.g. `bg-card`, `border`) instead of hardcoded colors.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
Receives the list of municipalities to populate the dropdowns. Consumes `GeoContext`.

## Outputs
Renders popovers and command lists for selecting geographic entities.

## Interfaces
- `GeoFilter`: React functional component.

## Ownership and lifecycle
Experimental shared component.
