---
kind: file
path: embuild-analyses/src/lib/embed-data-transformers.ts
role: Utility Library
workflows:
  - WF-embed-system
inputs: []
outputs: []
interfaces:
  - transformToEmbedDataRows (function)
  - validateStandardEmbedDataRow (function)
stability: stable
owner: Unknown
safe_to_delete_when: When embed data transformation logic is replaced
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/lib/embed-data-transformers.ts

## Role

Data transformation utilities for converting raw JSON data into display-ready format for embed visualizations.

## Why it exists

Provides reusable transformation functions that convert StandardEmbedDataRow format (with m, y, q, and metric fields) into EmbedDataRow format (with label, value, periodCells) while keeping the original geo/time fields so charts, tables, and maps stay consistent.

## Used by workflows

- [WF-embed-system](../../../workflows/WF-embed-system.md): Data transformation for embed rendering

## Inputs

Accepts raw data arrays conforming to StandardEmbedDataRow structure and metric key for extraction.

## Outputs

Returns validated and transformed EmbedDataRow arrays ready for visualization components.

## Interfaces

- `transformToEmbedDataRows(rawData, metric)`: Transforms data array
- `validateStandardEmbedDataRow(data)`: Validates raw data structure with detailed error messages

## Ownership and lifecycle

Stability: Stable, core data transformation utility.
Safe to delete when: Embed data format changes or transformation approach is replaced.
Superseded by: None.
