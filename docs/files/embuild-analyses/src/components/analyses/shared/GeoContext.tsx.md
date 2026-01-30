---
kind: file
path: embuild-analyses/src/components/analyses/shared/GeoContext.tsx
role: State Management
workflows:
  - WF-vergunningen-goedkeuringen
inputs:
  - name: children
    from: Props
    type: component
    schema: React Children
    required: true
outputs:
  - name: Context Provider
    to: React Tree
    type: component
    schema: React Context Provider
interfaces:
  - GeoProvider
  - useGeo
stability: experimental
owner: Unknown
safe_to_delete_when: Global geographical state is no longer needed
superseded_by: null
last_reviewed: 2025-12-14
---

# File: embuild-analyses/src/components/analyses/shared/GeoContext.tsx

## Role
Provides a React Context to manage the global geographical selection state (Level, Region, Province, Municipality).

## Why it exists
To allow multiple components (filters, charts, maps) to share and react to the same geographical selection without prop drilling.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
Receives children components.

## Outputs
Provides `GeoContext` with state values and setters.

## Interfaces
- `GeoProvider`: Context Provider component.
- `useGeo`: Custom hook to consume the context.

## Ownership and lifecycle
Experimental shared component.
