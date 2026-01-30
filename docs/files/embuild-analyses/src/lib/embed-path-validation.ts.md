---
kind: file
path: embuild-analyses/src/lib/embed-path-validation.ts
role: Utility Library
workflows:
  - WF-embed-system
inputs: []
outputs: []
interfaces:
  - validateNoPathTraversal (function)
  - validatePathPrefix (function)
  - validateEmbedPath (function)
  - PathValidationResult (type)
stability: stable
owner: Unknown
safe_to_delete_when: When embed path validation is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/lib/embed-path-validation.ts

## Role

Shared validation utilities for embed configuration paths, used both at runtime (development warnings) and build-time (validation scripts).

## Why it exists

Ensures embed data paths are safe and follow conventions by checking for path traversal patterns (.., ~) and correct prefixes. Provides consistent validation across runtime and build processes.

## Used by workflows

- [WF-embed-system](../../../workflows/WF-embed-system.md): Path security validation

## Inputs

Path strings and expected slug prefixes for validation.

## Outputs

Returns PathValidationResult objects containing validation status and error messages.

## Interfaces

- `validateNoPathTraversal(path)`: Checks for .. and ~ patterns
- `validatePathPrefix(path, expectedPrefix)`: Validates path starts with slug
- `validateEmbedPath(path, pathType, slug)`: Combined validation
- `PathValidationResult`: {valid: boolean, errors: string[]}

## Ownership and lifecycle

Stability: Stable, security-critical validation.
Safe to delete when: Embed path handling changes or security model is replaced.
Superseded by: None.
