---
kind: file
path: embuild-analyses/src/components/EmbedAutoResize.tsx
role: UI Component
workflows:
  - WF-embed-system
inputs: []
outputs: []
interfaces:
  - EmbedAutoResize (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When iframe embedding is no longer supported
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/EmbedAutoResize.tsx

## Role

Client-side component that automatically communicates iframe content height to parent window for dynamic iframe resizing.

## Why it exists

Ensures embedded visualizations display correctly without scrollbars by continuously monitoring content height and sending resize messages to the parent window via postMessage API.

## Used by workflows

- [WF-embed-system](../../../workflows/WF-embed-system.md): Core component for iframe height management

## Inputs

None. This component runs client-side and monitors the DOM automatically.

## Outputs

Sends postMessage events to parent window with type "data-blog-embed:resize" and calculated height value.

## Interfaces

Exports `EmbedAutoResize` React component (no props, renders null).
Uses ResizeObserver and MutationObserver to detect content changes.

## Ownership and lifecycle

Stability: Stable, critical for embed functionality.
Safe to delete when: Iframe embedding is deprecated or replaced with alternative solution.
Superseded by: None.
