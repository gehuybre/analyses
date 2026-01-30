# Migration Inventory

Single source of truth for blog metadata needed to migrate reliably. Fill this out before starting Phase 1.

## How to use
- Add a row per blog.
- Keep entries up to date as you discover new data sources or build steps.
- Use this to pre-fill `MIGRATION_STATUS.md`.

## Inventory table
| Blog ID | Title | Owner | Current Repo Path | Current Output URL | Data Sources | Data Refresh | Size/Weight | Build Command | Runtime/Versions | Secrets Needed | External Services | Shared Assets | Dependencies | Complexity | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| blog-a | Blog A Title | name | /embuild-analyses/analyses/blog-a | https://example.com/blog-a | API + CSV | daily | small | npm run build:blog-a | node 20, python 3.11 | GH secrets: DATA_API_KEY | data provider API | shared chart theme | chart-builder@1.2.3 | low | |
| blog-b | Blog B Title | name | /embuild-analyses/analyses/blog-b | https://example.com/blog-b | GSheets + LFS | weekly | medium | npm run build:blog-b | node 20 | GH secrets: SHEET_TOKEN | Google Sheets | shared map assets | map-builder@0.9.0 | medium | |
| blog-c | Blog C Title | name | /embuild-analyses/analyses/blog-c | https://example.com/blog-c | DB + API + LFS | monthly | large | npm run build:blog-c | node 20, python 3.11 | GH secrets: DB_URL, API_KEY | Postgres + API | shared templates | db-utils@2.0.1 | high | |

## Field notes
- Data Sources: include file paths, APIs, databases, and LFS usage.
- Data Refresh: frequency or trigger (daily/weekly/manual/on-deploy).
- Size/Weight: small/medium/large or approximate MB/GB.
- Runtime/Versions: node/python + key libs if version-locked.
- Shared Assets: list templates, CSS, embeds, shared data.
- Dependencies: internal scripts, packages, or cross-blog coupling.
