---
kind: file
path: scripts/generate_province_map.py
role: Build Script
workflows: []
inputs:
  - name: belgium_municipalities.json
    from: embuild-analyses/public/maps/belgium_municipalities.json
    type: geojson
    schema: Municipality-level GeoJSON with NIS codes
    required: true
outputs:
  - name: belgium_provinces.json
    to: embuild-analyses/public/maps/belgium_provinces.json
    type: geojson
    schema: Province-level GeoJSON aggregated from municipalities
interfaces:
  - Command line script
stability: stable
owner: Unknown
safe_to_delete_when: When province boundaries are sourced from official data instead of generated
superseded_by: null
last_reviewed: 2026-01-05
---

# File: scripts/generate_province_map.py

## Role

Python script that generates province-level GeoJSON boundaries by aggregating municipality geometries using topological operations.

## Why it exists

Creates province boundary files from municipality data using proper geographic operations via geopandas. Maps municipality NIS codes to provinces and dissolves geometries to create province polygons.

## Used by workflows

None currently. This is a utility script run manually when province map data needs to be regenerated.

## Inputs

Municipality-level GeoJSON file containing all Belgian municipalities with NIS codes and geometries.

## Outputs

Province-level GeoJSON file with aggregated geometries, province codes, names, and NUTS IDs.

## Interfaces

Command line script executed with Python:
```bash
python scripts/generate_province_map.py
```

Uses PROVINCE_MAPPING dictionary to map NIS code prefixes to province information.

## Ownership and lifecycle

Stability: Stable, utility script.
Safe to delete when: Province boundaries are obtained from official sources or the mapping approach changes.
Superseded by: None.
