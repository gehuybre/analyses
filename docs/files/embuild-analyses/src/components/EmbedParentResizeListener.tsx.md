---
kind: file
path: embuild-analyses/src/components/EmbedParentResizeListener.tsx
role: UI Component
workflows:
  - WF-embed-system
inputs: []
outputs: []
interfaces:
  - EmbedParentResizeListener (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When parent-side iframe handling is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/EmbedParentResizeListener.tsx

## Role

Parent-side component that listens for postMessage resize events from embedded iframes and updates iframe height accordingly.

## Why it exists

Complements EmbedAutoResize by receiving height messages from child iframes and applying them to the iframe element, enabling seamless auto-resizing.

## Used by workflows

- [WF-embed-system](../../../workflows/WF-embed-system.md): Parent-side iframe height management

## Inputs

Listens for window postMessage events with type "data-blog-embed:resize" containing height value.

## Outputs

Updates iframe element height style when matching resize messages are received.

## Interfaces

Exports `EmbedParentResizeListener` React component (no props, renders null).
Uses window.addEventListener for postMessage event handling.

## Ownership and lifecycle

Stability: Stable, required for parent pages embedding content.
Safe to delete when: Iframe embedding is deprecated.
Superseded by: None.
