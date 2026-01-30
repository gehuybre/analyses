---
kind: file
path: embuild-analyses/analyses/prijsherziening-index-i-2021/src/process_prijsherziening.py
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

# File: embuild-analyses/analyses/prijsherziening-index-i-2021/src/process_prijsherziening.py

Processes data for the price-revision index (Index I 2021) analysis.

What it does:
- Loads input price series and contract revision datasets
- Computes the index values according to the documented methodology and builds comparators
- Exports results to `results/` in JSON/CSV formats for charts and tables

Usage
------

```bash
python embuild-analyses/analyses/prijsherziening-index-i-2021/src/process_prijsherziening.py
```

Notes
-----
- Ensure the required input CSVs are available in the `data/` directory.
- The script contains domain-specific index computations; review inline comments when making changes.
