---
kind: file
path: embuild-analyses/scripts/validate-embed-paths.ts
role: Build Script
workflows:
  - WF-embed-system
inputs:
  - name: EMBED_CONFIGS
    from: embuild-analyses/src/lib/embed-config.ts
    type: config
    schema: Embed configuration array
    required: true
  - name: Data files referenced in configs
    from: embuild-analyses/analyses/*/results/*.json
    type: json
    schema: Analysis result files
    required: true
outputs: []
interfaces:
  - validateEmbedConfigs (function)
  - runValidation (function)
stability: stable
owner: Unknown
safe_to_delete_when: When embed configuration validation is handled differently
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/scripts/validate-embed-paths.ts

## Role

Build-time validation script that checks embed configuration paths for correctness and security.

## Why it exists

Ensures all embed configurations reference valid files, have no path traversal vulnerabilities, follow naming conventions, and are registered in the data registry. Prevents build-time errors from configuration mistakes.

## Used by workflows

- [WF-embed-system](../../workflows/WF-embed-system.md): Configuration validation

## Inputs

Reads EMBED_CONFIGS from embed-config.ts and validates that all referenced data files exist on disk. Uses shared validation functions from embed-path-validation.ts.

## Outputs

Console output showing validation results. Exits with code 1 if validation fails, 0 if successful.

## Interfaces

- Can be imported and used as module: `validateEmbedConfigs()`, `runValidation()`
- Can be executed directly: `node scripts/validate-embed-paths.ts`

Checks:
- File existence
- Path security (no .., ~)
- Correct path prefixes
- Data registry entries

## Ownership and lifecycle

Stability: Stable, important build validation.
Safe to delete when: Embed system is removed or validation approach changes.
Superseded by: None.
