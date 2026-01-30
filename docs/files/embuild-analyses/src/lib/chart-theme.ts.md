---
kind: file
path: embuild-analyses/src/lib/chart-theme.ts
role: Styling constants
workflows: []
inputs: []
outputs: []
interfaces:
- CHART_COLORS
- MAP_COLOR_SCHEMES
- CHART_THEME
- TABLE_THEME
stability: experimental
owner: Unknown
safe_to_delete_when: Unknown
superseded_by: null
last_reviewed: 2025-12-30
---

# File: embuild-analyses/src/lib/chart-theme.ts

## Role
Central configuration for all styling constants that cannot be easily managed via Tailwind CSS variables alone, such as Recharts configurations and map color schemes.

## Why it exists
Many visualization libraries (Recharts, React Simple Maps) require JavaScript objects for configuration rather than CSS classes. This file creates a single source of truth for these styles, syncing them with the design system.

## Used by workflows
- Unknown

## Inputs
None.

## Outputs
- `CHART_COLORS`: Object containing color constants.
- `MAP_COLOR_SCHEMES`: Object containing color arrays for map ramps.
- `CHART_THEME`: Object containing chart layout constants (margin, font size).
- `TABLE_THEME`: Object containing table styling constants.

## Interfaces
- `CHART_COLORS`: Color palette exports.
- `MAP_COLOR_SCHEMES`: Map ramp exports.
- `CHART_THEME`: Chart config exports.
- `TABLE_THEME`: Table config exports.

## Ownership and lifecycle
Stability is experimental. It should be maintained as long as the project uses Recharts and React Simple Maps.
