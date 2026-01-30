---
kind: file
path: embuild-analyses/analyses/gebouwenpark/src/inspect.py
role: Utility Script
workflows: []
inputs:
  - name: building_stock_open_data.txt
    from: embuild-analyses/analyses/gebouwenpark/data/building_stock_open_data.txt
    type: csv
    schema: Statbel building stock data
    required: true
outputs: []
interfaces:
  - Command line script with console output
stability: experimental
owner: Unknown
safe_to_delete_when: After data exploration is complete or when no longer needed for debugging
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/analyses/gebouwenpark/src/inspect.py

## Role

Data exploration utility script for inspecting Statbel building stock data structure and contents.

## Why it exists

Helps developers understand the raw data format before processing. Prints column names, sample rows, unique years, REFNIS levels, and building types. Useful for debugging and data validation.

## Used by workflows

None. This is a development/debugging utility.

## Inputs

Raw building stock data file in CSV/pipe-delimited format.

## Outputs

Console output showing:
- Column names
- Sample rows (first 5 from 2022)
- All available years
- Row count for specific year
- Unique REFNIS levels
- Unique building types

## Interfaces

Python script executed from project root:
```bash
python embuild-analyses/analyses/gebouwenpark/src/inspect.py
```

Auto-detects delimiter (pipe or comma).

## Ownership and lifecycle

Stability: Experimental, utility for data exploration.
Safe to delete when: Data structure is well understood or script is no longer useful.
Superseded by: None, but may not be needed after initial data exploration.
