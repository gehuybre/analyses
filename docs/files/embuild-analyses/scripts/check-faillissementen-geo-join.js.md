---
kind: file
path: embuild-analyses/scripts/check-faillissementen-geo-join.js
role: Validation Script
workflows: []
inputs:
  - name: provinces_construction.json
    from: embuild-analyses/analyses/faillissementen/results/provinces_construction.json
    type: json
    schema: Province-level bankruptcy data
    required: true
  - name: provinces.json
    from: embuild-analyses/analyses/faillissementen/results/provinces.json
    type: json
    schema: Province-level bankruptcy data
    required: true
  - name: belgian-provinces.json
    from: embuild-analyses/shared-data/belgian-provinces.json
    type: json
    schema: Reference province codes
    required: true
  - name: faillissementen-geo-join-allowlist.json
    from: embuild-analyses/scripts/faillissementen-geo-join-allowlist.json
    type: json
    schema: Allowed unmatched codes
    required: false
outputs: []
interfaces:
  - Command line script (exit code 0 = success, 1 = failure)
stability: stable
owner: Unknown
safe_to_delete_when: When faillissementen geo-join validation is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/scripts/check-faillissementen-geo-join.js

## Role

Validation script that verifies all provinces and municipalities in bankruptcy data can be matched to geographic features in map data.

## Why it exists

Prevents rendering errors by ensuring every province and municipality code in the faillissementen analysis has corresponding geographic data. Validates data integrity before deployment.

## Used by workflows

None currently. This is a validation script run manually or in CI before deploying faillissementen updates.

## Inputs

- Province bankruptcy data files from faillissementen results
- Reference Belgian province codes from shared-data
- Optional allowlist for known unmatched codes

## Outputs

Console output showing validation results and any unmatched codes. Exits with code 1 if validation fails.

## Interfaces

Node.js script executed directly:
```bash
node embuild-analyses/scripts/check-faillissementen-geo-join.js
```

Checks provinces and municipalities, reports unmatched codes, and respects allowlist.

## Ownership and lifecycle

Stability: Stable, important data validation.
Safe to delete when: Faillissementen analysis is removed or geo-join validation is handled differently.
Superseded by: None.
