---
kind: file
path: embuild-analyses/analyses/gemeentelijke-investeringen/src/check_data.py
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

# File: embuild-analyses/analyses/gemeentelijke-investeringen/src/check_data.py

Sanity checks and validation utilities for municipal investments processing.

What it does:
- Runs consistency checks on raw and intermediate datasets (missing values, expected columns, NIS code coverage)
- Reports anomalies and writes summary reports for review

Usage
------

```bash
python embuild-analyses/analyses/gemeentelijke-investeringen/src/check_data.py
```

Notes
-----
- Useful as a first step in the processing pipeline to detect format regressions in input files.
- This script is intended to be run locally by maintainers and integrated into data CI when necessary.
