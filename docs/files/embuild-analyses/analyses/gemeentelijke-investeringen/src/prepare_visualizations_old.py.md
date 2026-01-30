---
kind: file
path: embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations_old.py
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

# File: embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations_old.py

Legacy visualization preparation helpers retained for reproducibility and historical reference.

What it does:
- Contains older transformation steps and experimentation code that preceded `prepare_visualizations.py`
- Useful to reproduce earlier exports or to compare different processing strategies

Usage
------

```bash
# Typically not required in the main pipeline; run for debugging or for reproducing old outputs
python embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations_old.py
```

Notes
-----
- Keep as a reference; avoid using it as the primary pipeline unless explicitly required for reproducibility tests.
