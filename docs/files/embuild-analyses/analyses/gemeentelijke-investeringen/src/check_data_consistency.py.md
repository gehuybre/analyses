---
kind: file
path: embuild-analyses/analyses/gemeentelijke-investeringen/src/check_data_consistency.py
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

# File: embuild-analyses/analyses/gemeentelijke-investeringen/src/check_data_consistency.py

Cross-file consistency checks for the municipal investments dataset.

What it does:
- Compares related datasets (e.g., yearly aggregates, municipality totals, and metadata) to detect mismatches
- Validates sums, identifies duplicate records, and flags inconsistent category mappings
- Produces a machine-readable report and a human-friendly summary for review

Usage
------

```bash
python embuild-analyses/analyses/gemeentelijke-investeringen/src/check_data_consistency.py
```

Notes
-----
- Run after the main processing step to verify that published `results/` files are internally consistent.
- Output reports should be inspected and addressed before deploying updates to the public site.
