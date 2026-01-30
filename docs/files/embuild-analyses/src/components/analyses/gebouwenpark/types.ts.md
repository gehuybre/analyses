---
kind: file
path: embuild-analyses/src/components/analyses/gebouwenpark/types.ts
role: Type Definitions
workflows: []
inputs: []
outputs: []
interfaces:
  - BuildingTypeKey
  - BuildingTypeStats
  - NationalSnapshot
  - RegionalSnapshot
  - TimeSeriesNational
  - TimeSeriesRegional
  - GebouwenData
stability: stable
owner: Unknown
safe_to_delete_when: When gebouwenpark components are removed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/analyses/gebouwenpark/types.ts

## Role

TypeScript type definitions for Belgian Building Stock (Gebouwenpark) data structures.

## Why it exists

Provides type safety and autocompletion for all gebouwenpark components, ensuring consistent data handling across dashboard, charts, and tables.

## Used by workflows

None. This is a type definition file used by TypeScript compilation.

## Inputs

None. This file only exports types.

## Outputs

Type definitions for building types (closed-row, semi-detached, detached, apartments, etc.), snapshots, and time series data structures.

## Interfaces

Exports types: BuildingTypeKey, BuildingTypeStats, NationalSnapshot, RegionalSnapshot, TimeSeriesNational, TimeSeriesRegional, GebouwenData.

## Ownership and lifecycle

Stability: Stable, foundational types for gebouwenpark analysis.
Safe to delete when: Gebouwenpark analysis and all related components are removed.
Superseded by: None.
