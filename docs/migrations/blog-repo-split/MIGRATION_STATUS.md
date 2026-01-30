# Migration Status

Track progress per blog. Keep this in sync with the inventory and update after each milestone.

## Status legend
- planned: queued, not started
- in-progress: work actively ongoing
- blocked: waiting on dependency/decision
- migrated: content moved, hub link updated
- verified: builds + links + output validated
- archived: retired blog or intentionally skipped

## Per-blog status
| Blog ID | Owner | Complexity | Current Repo Path | Target Repo Path | Data Sources | Build Command | Runtime/Versions | Secrets Needed | Output URL | Status | Last Verified | Risks/Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| blog-a | name | low | /embuild-analyses/analyses/blog-a | /blogs/blog-a | API + CSV | npm run build:blog-a | node 20, python 3.11 | GH secrets: DATA_API_KEY | https://example.com/blog-a | planned | 2026-01-29 | |
| blog-b | name | medium | /embuild-analyses/analyses/blog-b | /blogs/blog-b | GSheets + LFS | npm run build:blog-b | node 20 | GH secrets: SHEET_TOKEN | https://example.com/blog-b | planned | 2026-01-29 | |
| blog-c | name | high | /embuild-analyses/analyses/blog-c | /blogs/blog-c | DB + API + LFS | npm run build:blog-c | node 20, python 3.11 | GH secrets: DB_URL, API_KEY | https://example.com/blog-c | planned | 2026-01-29 | |
