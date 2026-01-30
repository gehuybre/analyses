---
kind: file
path: embuild-analyses/src/lib/utils.ts
role: Utility Library
workflows: []
inputs: []
outputs: []
interfaces:
  - cn (function)
stability: stable
owner: Unknown
safe_to_delete_when: When Tailwind class merging is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/lib/utils.ts

## Role

Utility function for merging Tailwind CSS class names with conflict resolution.

## Why it exists

Provides the standard `cn()` helper function used throughout shadcn/ui components to merge and deduplicate Tailwind CSS classes. Uses clsx for conditional classes and tailwind-merge for intelligent conflict resolution.

## Used by workflows

None. This is a foundational utility used across all UI components.

## Inputs

Accepts any number of class value inputs (strings, objects, arrays).

## Outputs

Returns a single merged class string with conflicts resolved (e.g., later classes override earlier ones).

## Interfaces

Exports `cn(...inputs)` function - a wrapper around twMerge(clsx(...)).

## Ownership and lifecycle

Stability: Stable, standard shadcn/ui utility.
Safe to delete when: The project stops using Tailwind CSS or shadcn/ui components.
Superseded by: None.
