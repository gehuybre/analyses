---
kind: file
path: embuild-analyses/analyses/gebouwenpark/src/process_gebouwen.py
role: Data Processing Script
workflows: []
inputs:
  - name: building_stock_open_data.txt
    from: embuild-analyses/analyses/gebouwenpark/data/building_stock_open_data.txt
    type: csv
    schema: Statbel building stock data with delimiter-separated values
    required: true
outputs:
  - name: stats_2025.json
    to: embuild-analyses/analyses/gebouwenpark/results/stats_2025.json
    type: json
    schema: Processed building statistics with snapshot and time series
interfaces:
  - Command line script
stability: stable
owner: Unknown
safe_to_delete_when: When gebouwenpark data processing is replaced or analysis is removed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/analyses/gebouwenpark/src/process_gebouwen.py

## Role

Python data processing script that transforms raw Statbel building stock data into JSON format for visualization.

## Why it exists

Processes Statbel's cadastral building stock data to create structured snapshots and time series for the gebouwenpark analysis. Aggregates data by region and building type, distinguishing residential buildings (R1-R4) from other types.

## Used by workflows

None currently. This is run manually when updating the gebouwenpark analysis with new data.

## Inputs

Raw building stock data file from Statbel in pipe-delimited text format containing:
- Year (CD_YEAR)
- REFNIS level (CD_REFNIS_LVL) - municipality, province, region codes
- Building type (CD_BUILDING_TYPE_NL) - R1-R5, other
- Counts

## Outputs

JSON file containing:
- metadata: Year, source info
- snapshot_2025: Current state by region and building type
- time_series: Historical trends from 1995-2025
- available_stat_types: List of building type categories

## Interfaces

Python script executed from project root:
```bash
python embuild-analyses/analyses/gebouwenpark/src/process_gebouwen.py
```

Defines residential_codes as R1-R4 (excludes R5 trade houses).

## Ownership and lifecycle

Stability: Stable, critical data transformation script.
Safe to delete when: Gebouwenpark analysis is removed or data processing is automated differently.
Superseded by: None.
