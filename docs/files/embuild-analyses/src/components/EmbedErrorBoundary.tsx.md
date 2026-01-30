---
kind: file
path: embuild-analyses/src/components/EmbedErrorBoundary.tsx
role: UI Component
workflows:
  - WF-embed-system
inputs: []
outputs: []
interfaces:
  - EmbedErrorBoundary (React class component)
stability: stable
owner: Unknown
safe_to_delete_when: When embed error handling is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/EmbedErrorBoundary.tsx

## Role

React Error Boundary component for gracefully handling rendering errors in embedded visualizations.

## Why it exists

Prevents entire embed iframe from crashing when component errors occur. Shows user-friendly error message instead of blank screen, with developer details in development mode.

## Used by workflows

- [WF-embed-system](../../../workflows/WF-embed-system.md): Error handling for embed pages

## Inputs

Accepts children React nodes to wrap and monitor for errors.

## Outputs

Renders children normally. On error, displays fallback UI with error message (and stack trace in development).

## Interfaces

Exports `EmbedErrorBoundary` class component implementing React Error Boundary lifecycle methods.
Logs errors to console for debugging.

## Ownership and lifecycle

Stability: Stable, essential error handling component.
Safe to delete when: Embed system is removed or replaced.
Superseded by: None.
