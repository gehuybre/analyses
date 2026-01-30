---
kind: file
path: embuild-analyses/src/lib/embed-data-registry.ts
role: Data Module
workflows:
  - WF-embed-system
inputs:
  - name: data_quarterly.json
    from: embuild-analyses/analyses/vergunningen-goedkeuringen/results/data_quarterly.json
    type: json
    schema: Quarterly permit data with municipality codes
    required: true
  - name: municipalities.json
    from: embuild-analyses/analyses/vergunningen-goedkeuringen/results/municipalities.json
    type: json
    schema: Municipality code and name mappings
    required: true
outputs: []
interfaces:
  - getEmbedDataModule (function)
  - hasEmbedData (function)
  - EmbedDataModule (type)
stability: stable
owner: Unknown
safe_to_delete_when: When embed system is replaced with different data loading mechanism
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/lib/embed-data-registry.ts

## Role

Centralized registry for all embed data imports, providing explicit synchronous imports that are visible to the bundler at build time.

## Why it exists

Makes all embed data paths explicit for webpack/vite bundlers, avoiding issues with dynamic imports using template literals. Provides a reliable, simple alternative to dynamic imports while keeping bundle size manageable for the current scale.

## Used by workflows

- [WF-embed-system](../../../workflows/WF-embed-system.md): Core data loading for embed pages

## Inputs

Imports and validates data files for each embeddable section:
- Quarterly data with municipality codes and metrics
- Municipality code-to-name mappings

## Outputs

Exports functions to retrieve validated and transformed embed data modules by slug and section identifier.

## Interfaces

- `getEmbedDataModule(slug, section)`: Returns data module or null
- `hasEmbedData(slug, section)`: Checks if data is registered
- `EmbedDataModule` type: Contains data and municipalities arrays

## Ownership and lifecycle

Stability: Stable, central to embed system.
Safe to delete when: Embed data loading approach changes or system is replaced.
Superseded by: None. Note: May evolve to dynamic imports if bundle size becomes a concern.
