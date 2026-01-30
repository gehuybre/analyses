---
kind: workflow
id: WF-update-vergunningen-data
owner: Unknown
status: active
trigger: Monthly schedule + manual
inputs:
  - name: INPUT_URL
    type: url
    required: true
    schema: Zip file with Statbel Building permits data
  - name: INPUT_FILE_PATH
    type: file
    required: false
    schema: Local fallback input file (used when INPUT_URL is empty/unset)
outputs:
  - name: results/*
    type: files
    schema: Updated JSON outputs for the vergunningen-goedkeuringen analysis
  - name: .remote_metadata.json
    type: json
    schema: {url, etag, last_modified, sha256}
entrypoints:
  - .github/workflows/update-vergunningen-data.yml
files:
  - .github/workflows/update-vergunningen-data.yml
  - embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py
  - embuild-analyses/analyses/vergunningen-goedkeuringen/data/.remote_metadata.json
  - embuild-analyses/analyses/vergunningen-goedkeuringen/results/
last_reviewed: 2025-12-21
---

# Update vergunningen data (GitHub Actions)

This workflow keeps the `vergunningen-goedkeuringen` analysis data up to date by downloading the latest Statbel building permits dataset, re-running the processor, and committing updated results back to `main`.

## Triggers

- Scheduled: monthly on the 1st at `00:00` (UTC) via cron `0 0 1 * *`.
- Manual: `workflow_dispatch`.

## What it does

1. Checkout the repo (full history) and set up Python.
2. Install Python dependencies from `requirements.txt`.
3. Check remote metadata (HTTP `ETag` / `Last-Modified`) against `embuild-analyses/analyses/vergunningen-goedkeuringen/data/.remote_metadata.json`.
   - If unchanged, the workflow exits without re-processing.
   - If changed (or no prior metadata), it proceeds.
4. Run `embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py`.
   - Uses `INPUT_URL` to download the dataset (default points at Statbel).
   - Can fall back to `INPUT_FILE_PATH` if `INPUT_URL` is empty/unset and a local file exists.
5. Write updated `.remote_metadata.json` (and `sha256` if the downloaded file exists on disk).
6. Commit and push changes (only if files under `embuild-analyses/analyses/vergunningen-goedkeuringen/results/` or `.remote_metadata.json` changed).

## Notes / assumptions

- The workflow pushes directly to `main`, so it requires `contents: write`.
- The metadata check is a best-effort skip: if the remote server doesn’t provide `ETag`/`Last-Modified`, the workflow will usually re-process.

