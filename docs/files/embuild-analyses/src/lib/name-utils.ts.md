---
kind: file
path: embuild-analyses/src/lib/name-utils.ts
role: Utility Library
workflows: []
inputs: []
outputs: []
interfaces:
  - formatMunicipalityName (function)
stability: stable
owner: Unknown
safe_to_delete_when: When municipality name formatting is handled differently
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/lib/name-utils.ts

## Role

Utility function for formatting municipality names with proper capitalization.

## Why it exists

Ensures consistent capitalization of municipality names across the application. Handles hyphenated names (e.g., "Sint-Niklaas") correctly by capitalizing each part.

## Used by workflows

None. This is a shared utility function used where municipality names are displayed.

## Inputs

Accepts a municipality name string (potentially in all caps or lowercase).

## Outputs

Returns properly capitalized name with first letter uppercase and rest lowercase, preserving hyphens.

## Interfaces

Exports `formatMunicipalityName(name)` function.

## Ownership and lifecycle

Stability: Stable, simple utility function.
Safe to delete when: Municipality name formatting is no longer needed or handled elsewhere.
Superseded by: None.
