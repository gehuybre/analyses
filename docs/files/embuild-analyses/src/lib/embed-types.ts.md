---
kind: file
path: embuild-analyses/src/lib/embed-types.ts
role: Type Definitions
workflows:
  - WF-embed-system
inputs: []
outputs: []
interfaces:
  - StandardEmbedDataRow (type)
  - EmbedDataRow (type)
  - MunicipalityData (type)
  - StandardEmbedData (type)
  - KnownMetricKey (type)
  - getMetricValue (function)
  - isKnownMetric (function)
  - validateMunicipalityData (function)
  - validateEmbedDataRows (function)
stability: stable
owner: Unknown
safe_to_delete_when: When embed type system is replaced
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/lib/embed-types.ts

## Role

TypeScript type definitions and runtime validation for embed data structures.

## Why it exists

Provides type safety and runtime type guards for all embed data, ensuring consistency across data loading, transformation, and rendering. Defines standard formats for municipality data, quarterly data, and display data.

## Used by workflows

- [WF-embed-system](../../../workflows/WF-embed-system.md): Core type definitions

## Inputs

None. This file exports types and validation functions.

## Outputs

Type definitions for:
- StandardEmbedDataRow: Raw data format (m, y, q, metrics)
- EmbedDataRow: Display format (label, value, periodCells)
- MunicipalityData: Municipality code/name pairs
- KnownMetricKey: Recognized metric keys (ren, new, etc.)

Runtime validators ensure type safety at data loading time.

## Interfaces

Exports types, type guards (isMunicipalityData, isEmbedDataRow), and validation functions (validateMunicipalityData, validateEmbedDataRows, getMetricValue).

## Ownership and lifecycle

Stability: Stable, foundational types for embed system.
Safe to delete when: Embed data structure changes or system is replaced.
Superseded by: None. Note: Add new metric keys to KnownMetricKey as analyses are added.
