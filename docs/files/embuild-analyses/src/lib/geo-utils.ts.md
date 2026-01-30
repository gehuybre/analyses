---
kind: file
path: embuild-analyses/src/lib/geo-utils.ts
role: Utility Library
workflows:
  - WF-vergunningen-goedkeuringen
inputs: []
outputs: []
interfaces:
  - Region
  - Province
  - Municipality
  - getRegionForProvince
  - getProvinceForMunicipality
  - getRegionForMunicipality
stability: experimental
owner: Unknown
safe_to_delete_when: No geographical logic is needed
superseded_by: null
last_reviewed: 2025-12-14
---

# File: embuild-analyses/src/lib/geo-utils.ts

## Role
Provides type definitions and helper functions for handling Belgian geographical entities (Regions, Provinces, Municipalities).

## Why it exists
To centralize the logic for mapping municipalities to provinces and regions, and to define shared constants for these entities.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
None.

## Outputs
Exports types and helper functions.

## Interfaces
- `Region`, `Province`, `Municipality`: Type definitions.
- `REGIONS`, `PROVINCES`: Constant arrays.
- `getRegionForProvince(provinceCode)`: Returns the region code for a province.
- `getProvinceForMunicipality(municipalityCode)`: Returns the province code for a municipality based on NIS code logic.
- `getRegionForMunicipality(municipalityCode)`: Returns the region code for a municipality.

## Ownership and lifecycle
Experimental utility.
