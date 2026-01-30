---
kind: file
path: embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py
role: Data Processing Script
workflows:
  - WF-vergunningen-goedkeuringen
inputs:
  - name: BV_opendata_251125_082807.txt
    from: ../data/
    type: file
    schema: Pipe-delimited CSV-like
    required: true
outputs:
  - name: data_quarterly.json
    to: ../results/
    type: json
    schema: List of {y, q, m, ren, new}
  - name: municipalities.json
    to: ../results/
    type: json
    schema: List of {code, name}
interfaces:
  - process_data()
stability: experimental
owner: Unknown
safe_to_delete_when: Analysis is deprecated
superseded_by: null
last_reviewed: 2025-12-13
---

# File: embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py

## Role
This script processes raw building permit data into a lightweight JSON format suitable for the web dashboard.

## Why it exists
To transform the large raw dataset into aggregated, quarterly statistics for renovation and new construction, minimizing the data payload for the frontend.

## Used by workflows
- [WF-vergunningen-goedkeuringen](../../../../../workflows/WF-vergunningen-goedkeuringen.md)

## Inputs
Reads a local text file `BV_opendata_251125_082807.txt` containing raw permit data.

## Outputs
Produces two JSON files in the `results/` directory:
- `data_quarterly.json`: Contains the aggregated quarterly data points.
- `data_monthly.json`: Contains the aggregated monthly data points (y, mo, m, ren, new).
- `municipalities.json`: Contains the mapping of municipality codes to names.

## Interfaces
- `process_data()`: Main function to execute the logic.

## Ownership and lifecycle
Experimental script specific to the "Vergunningen goedkeuringen" analysis.
