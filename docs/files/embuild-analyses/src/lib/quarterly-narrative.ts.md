---
kind: file
path: embuild-analyses/src/lib/quarterly-narrative.ts
role: Utility Library
workflows: []
inputs: []
outputs: []
interfaces:
  - generateQuarterlyNarrative (function)
  - QuarterlySeriesPoint (type)
stability: stable
owner: Unknown
safe_to_delete_when: When quarterly narrative generation is removed or replaced
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/lib/quarterly-narrative.ts

## Role

Utility library for generating automated narrative descriptions of quarterly time series data trends.

## Why it exists

Provides human-readable text summaries of quarterly data, including comparisons to previous quarter, previous year, and rolling 4-quarter averages. Used to add contextual descriptions to charts and dashboards.

## Used by workflows

None. This is a utility library used in analysis components to generate trend descriptions.

## Inputs

Accepts quarterly series data points with index, label, and value, plus formatting options for subject, place, and number formatting.

## Outputs

Returns formatted narrative text describing trends, percentage changes, and comparisons (e.g., "In Q4 2024, there were 15% more permits in Antwerp than in Q3 2024").

## Interfaces

- `generateQuarterlyNarrative(options)`: Main function
- `QuarterlySeriesPoint`: Type for data points
- Supports custom value and percent formatters

## Ownership and lifecycle

Stability: Stable, useful narrative generation utility.
Safe to delete when: Automated narratives are no longer needed in dashboards.
Superseded by: None.
