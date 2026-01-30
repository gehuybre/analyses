---
kind: workflow
id: WF-update-starters-stoppers-data
owner: Unknown
status: active
trigger: Monthly schedule + manual
inputs:
  - name: INPUT_URL
    type: url
    required: true
    schema: Zip file with Statbel VAT survival data (TF_VAT_SURVIVALS)
  - name: INPUT_FILE_PATH
    type: file
    required: false
    schema: Optional local ZIP/TXT file path (used instead of download)
outputs:
  - name: vat_survivals.json
    type: json
    to: embuild-analyses/analyses/starters-stoppers/results/
    schema: Array of records with counts (fr/s1..s5) and rates (r1..r5)
  - name: lookups.json
    type: json
    to: embuild-analyses/analyses/starters-stoppers/results/
    schema: Lookup tables for legal type, region, province, worker class, NACE
  - name: metadata.json
    type: json
    to: embuild-analyses/analyses/starters-stoppers/results/
    schema: Variable descriptions (NL/FR/EN)
  - name: vat_survivals.csv
    type: csv
    to: embuild-analyses/analyses/starters-stoppers/results/
    schema: Flat export of vat_survivals.json
  - name: .remote_metadata.json
    type: json
    to: embuild-analyses/analyses/starters-stoppers/data/
    schema: {url, etag, last_modified, sha256}
entrypoints:
  - .github/workflows/update-starters-stoppers-data.yml
files:
  - .github/workflows/update-starters-stoppers-data.yml
  - embuild-analyses/analyses/starters-stoppers/src/process_data.py
  - embuild-analyses/analyses/starters-stoppers/data/.remote_metadata.json
  - embuild-analyses/analyses/starters-stoppers/results/
last_reviewed: 2025-12-22
---

# Update starters-stoppers data (GitHub Actions)

This workflow keeps the `starters-stoppers` analysis data up to date by downloading the latest Statbel VAT survival dataset, transforming it into frontend-friendly outputs, and committing the updated results back to `main`.

## Triggers

- Scheduled: monthly on the 1st at `00:00` (UTC) via cron `0 0 1 * *`.
- Manual: `workflow_dispatch`.

## What it does

1. Checkout the repo and set up Python.
2. Install Python dependencies from `requirements.txt`.
3. Check remote metadata (HTTP `ETag` / `Last-Modified`) against `embuild-analyses/analyses/starters-stoppers/data/.remote_metadata.json`.
4. If changed (or no prior metadata), run `embuild-analyses/analyses/starters-stoppers/src/process_data.py` which:
   - downloads `TF_VAT_SURVIVALS.zip`,
   - extracts `TF_VAT_SURVIVALS.txt`,
   - writes structured outputs to `embuild-analyses/analyses/starters-stoppers/results/`.
5. Update `.remote_metadata.json` (and `sha256` if the downloaded ZIP exists on disk).
6. Commit and push changes (only if results or metadata changed).

## Outputs

- `embuild-analyses/analyses/starters-stoppers/results/vat_survivals.json`: compact records with:
  - dimensies: `y` (jaar), `r` (regio), `p` (provincie), `n1` (NACE hoofdcode)
  - `fr`: first registrations (starters)
  - `s1..s5`: surviving firms after 1..5 years
  - `r1..r5`: survival rate (= `sN / fr`)
- `embuild-analyses/analyses/starters-stoppers/results/lookups.json`: dimension labels (NL/EN) for codes.
- `embuild-analyses/analyses/starters-stoppers/results/metadata.json`: variable metadata sourced from `embuild-analyses/analyses/starters-stoppers/data/metadata-VAR_VAT_SURVIVALS.xlsx`.
- `embuild-analyses/analyses/starters-stoppers/results/vat_survivals.csv`: flat table version of `vat_survivals.json`.
