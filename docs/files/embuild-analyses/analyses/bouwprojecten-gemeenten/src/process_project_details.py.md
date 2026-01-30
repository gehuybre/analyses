---
kind: file
path: embuild-analyses/analyses/bouwprojecten-gemeenten/src/process_project_details.py
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

# File: embuild-analyses/analyses/bouwprojecten-gemeenten/src/process_project_details.py

Process municipal investment project details from a CSV export of the meerjarenplan projecten.

What it does:
- Reads `data/meerjarenplan projecten.csv` (semicolon-separated CSV with quoted multi-line text blocks)
- Extracts code/description sections (Beleidsdoelstelling, Actieplan, Actie) from multi-line fields
- Parses yearly amounts (2026–2031) and computes totals & per-capita values
- Classifies projects using `category_keywords.py`
- Outputs chunked JSON files for the frontend in `public/data/bouwprojecten-gemeenten/` and a metadata file `projects_metadata.json`
  - Note: `projects_metadata.json` now contains enhanced per-category summaries including `project_count`, `total_amount` and `largest_projects` (top N largest projects per category, with per-project totals and yearly breakdowns).

Usage
------

```bash
python embuild-analyses/analyses/bouwprojecten-gemeenten/src/process_project_details.py
```

Notes
-----
- Requires `shared-data/nis/refnis.csv` to resolve municipality names to NIS codes.
- The script skips projects without any budgeted amounts or without a valid action description.
- Chunk size and other configuration are hard-coded but easy to adjust in the script.
