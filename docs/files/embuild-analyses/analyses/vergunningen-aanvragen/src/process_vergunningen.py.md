---
kind: file
path: embuild-analyses/analyses/vergunningen-aanvragen/src/process_vergunningen.py
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

# File: embuild-analyses/analyses/vergunningen-aanvragen/src/process_vergunningen.py

Processes building permit application data for the `vergunningen-aanvragen` analysis.

What it does:
- Parses raw permit application datasets, normalizes dates and permit types
- Aggregates counts by municipality/province and time period, and prepares datasets for maps and charts
- Produces `results/` JSON/CSV outputs used by embed components and the dashboard

Usage
------

```bash
python embuild-analyses/analyses/vergunningen-aanvragen/src/process_vergunningen.py
```

Notes
-----
- Input files may come from different providers with slightly different formats; the script contains mapping logic to handle these.
- Validate results with built-in checks or unit tests when updating parsing rules.
