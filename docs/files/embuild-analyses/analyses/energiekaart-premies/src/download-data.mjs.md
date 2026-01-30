---
kind: file
path: embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
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

# File: embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs

Downloads data files used by the Energiekaart Premies analysis.

What it does:
- Fetches remote open-data archives (CSV/zip) from public sources (municipal/regional datasets or provider APIs)
- Verifies downloaded files and places them under `analyses/energiekaart-premies/data/`
- May perform light extraction (unzip) and normalization of filenames to the expected local layout

Usage
------

```bash
# Run from repository root
node embuild-analyses/analyses/energiekaart-premies/src/download-data.mjs
```

Notes
-----
- The script is implemented in modern ES module JavaScript; run with a recent Node.js version.
- Network connectivity is required; some providers may throttle or require retries.
- The script is lightweight and intended to be re-run when sources update; it does not (by design) overwrite manually curated intermediate files without explicit confirmation.
