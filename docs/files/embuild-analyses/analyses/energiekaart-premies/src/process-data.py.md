---
kind: file
path: embuild-analyses/analyses/energiekaart-premies/src/process-data.py
role: Unknown
workflows: []
inputs: []
outputs: []
interfaces: []
stability: experimental
owner: Unknown
safe_to_delete_when: Unknown
superseded_by: null
last_reviewed: 2026-01-17
---

# File: embuild-analyses/analyses/energiekaart-premies/src/process-data.py

Processing pipeline for Energiekaart — normalises raw data and produces the JSON results consumed by the analysis UI.

What it does:
- Reads raw CSV/TSV files from `analyses/energiekaart-premies/data/` (downloaded by `download-data.mjs`)
- Cleans and normalises column names, aggregates per municipality or region as required
- Generates JSON/CSV `results/` files used by frontend components (e.g. heatmap tiles and aggregate tables)

Usage
------

```bash
python embuild-analyses/analyses/energiekaart-premies/src/process-data.py
```

Outputs
-------
- `analyses/energiekaart-premies/results/*.json` — aggregated datasets and lookup tables

Notes
-----
- Check the data sources and expected column mapping in the header comments of the script before running.
- The script assumes presence of shared lookups (`shared-data/nis/` or `shared-data/geo/`) for municipality mapping.
