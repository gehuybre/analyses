---
kind: file
path: embuild-analyses/src/components/analyses/shared/MapSection.tsx
role: UI Component
workflows: []
inputs:
  - name: Municipality GeoJSON data
    from: embuild-analyses/shared-data/geo/LAU_RG_01M_2024_4326.gpkg
    type: geojson
    schema: Municipality boundaries with 5-digit NIS codes
    required: true
outputs: []
interfaces:
  - MapSection (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When municipality-level map visualizations are no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/analyses/shared/MapSection.tsx

## Role

Simplified map component wrapper for municipality-level data visualization with integrated search functionality.

## Why it exists

Provides a complete map section that combines MunicipalityMap with MunicipalitySearch, simplifying the integration of interactive maps in analysis dashboards. Filters available municipalities based on data availability and supports auto-zoom to selected municipalities.

## Used by workflows

None. This is a shared UI component used across multiple analysis dashboards.

## Inputs

Accepts municipality-level data array with NIS codes, period information, and accessor functions for geographic codes and values. Loads municipality metadata from shared-data for search autocomplete.

## Outputs

Renders an interactive map with municipality search, time slider (optional), and province boundary overlays.

## Interfaces

Exports `MapSection` generic React component with props:
- data: Array of records with municipality data
- getGeoCode: Accessor for 5-digit NIS code
- getValue: Accessor for metric value
- getPeriod: Accessor for period (year/quarter)
- periods, showTimeSlider: Time slider configuration
- formatValue, tooltipLabel: Display formatting
- colorScheme, height, showProvinceBoundaries: Visual options

## Ownership and lifecycle

Stability: Stable, used across multiple analyses.
Safe to delete when: Municipality maps are deprecated or replaced with a different mapping solution.
Superseded by: None.
