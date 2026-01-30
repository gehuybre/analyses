---
kind: file
path: embuild-analyses/analyses/faillissementen/src/process_faillissementen.py
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

# File: embuild-analyses/analyses/faillissementen/src/process_faillissementen.py

Processing pipeline for company bankruptcy (faillissementen) data used in the Faillissementen analysis.

What it does:
- Loads raw bankruptcy registers / open datasets (CSV/JSON)
- Performs joins with geographic and sector reference data (`shared-data/`)
- Aggregates counts by year, province, and municipality and creates result files consumed by the UI
- Optionally performs geo-joins for construction-related bankruptcies (see helper allowlist JSON)

Usage
------

```bash
python embuild-analyses/analyses/faillissementen/src/process_faillissementen.py
```

Outputs
-------
- `analyses/faillissementen/results/*.json` and CSVs with aggregated counts by period and geography

Notes
-----
- Some downstream checks exist in `scripts/check-faillissementen-geo-join.js` to validate any geo-joining steps.
- Ensure `shared-data/nis` and `shared-data/geo` are present when running to allow municipality/province matching.
