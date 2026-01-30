---
kind: file
path: embuild-analyses/shared-data/process_shared_data.py
role: script
workflows: []
inputs:
  - embuild-analyses/shared-data/nace/NACEBEL_2025.xlsx
  - embuild-analyses/shared-data/nis/TU_COM_REFNIS.txt
  - embuild-analyses/shared-data/geo/LAU_RG_01M_2024_4326.gpkg
outputs:
  - embuild-analyses/shared-data/nace/nace_codes.csv
  - embuild-analyses/shared-data/nis/refnis.csv
  - embuild-analyses/public/maps/belgium_municipalities.json
last_reviewed: 2025-12-14
---

# Shared Data Processing Script

## Purpose
Converts raw shared data files (Excel, pipe-separated text) into standard CSV format for easier consumption by analysis scripts.

## Context
Run this script manually when new raw data is added to `shared-data`.

## Logic
1.  Checks for existence of source files.
2.  Converts `NACEBEL_2025.xlsx` to `nace_codes.csv`.
3.  Converts `TU_COM_REFNIS.txt` to `refnis.csv` (handling encoding and separators).
4.  Converts `LAU_RG_01M_2024_4326.gpkg` to `belgium_municipalities.json` (GeoJSON), simplifying geometry.

## Usage
```bash
python embuild-analyses/shared-data/process_shared_data.py
```
