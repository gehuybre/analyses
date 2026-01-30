---
kind: file
path: embuild-analyses/analyses/bouwondernemers/src/process_data.py
role: Unknown
workflows: []
inputs: []
outputs: []
interfaces: []
stability: experimental
owner: Unknown
safe_to_delete_when: Unknown
superseded_by: null
last_reviewed: 2026-01-19
---

# File: embuild-analyses/analyses/bouwondernemers/src/process_data.py

Script to ingest Statbel "Ondernemers - Datalab" yearly exports (TF_ENTREP_NACE_<year>.zip or VF_ENTREP_NACE_<year>.zip), extract the internal pipe-delimited files and aggregate counts for the construction sector (NACE codes starting with `F`).

What it does:
- Downloads TF_ENTREP_NACE_<year>.zip for years between MIN_YEAR and MAX_YEAR+5 (to detect newer releases)
- Extracts the data file and reads it as a pipe-delimited CSV
- Filters for NACE `F*` (construction sector) and aggregates by (year, region, sector), (year, region, gender), (year, region, age)
- Writes `by_sector.json`, `by_gender.json`, `by_region.json`, `by_age.json` and `lookups.json` in `results/`
- Updates `content.mdx` frontmatter `sourcePublicationDate` to the latest year found

Usage
------

```bash
python embuild-analyses/analyses/bouwondernemers/src/process_data.py
```

Notes
-----
- The script requires network access to download Statbel archives. It gracefully handles 404 responses when a year is not available.
- Outputs are written to `analyses/bouwondernemers/results/` and are consumed directly by the dashboard component.
