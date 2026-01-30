---
kind: file
path: embuild-analyses/analyses/bouwondernemers
role: Analysis
inputs:
  - name: TF_ENTREP_NACE_<year>.zip
    from: external (Statbel Datalab open data)
    type: zip
    schema: Annual export from Statbel Datalab (entrepreneurs by NACE, region, gender, age)
    required: true
outputs:
  - name: by_sector.json
    to: embuild-analyses/analyses/bouwondernemers/results/by_sector.json
    type: json
    schema: Aggregated counts by year + region + NACE subsector
  - name: by_gender.json
    to: embuild-analyses/analyses/bouwondernemers/results/by_gender.json
    type: json
    schema: Aggregated counts by year + region + gender
  - name: by_region.json
    to: embuild-analyses/analyses/bouwondernemers/results/by_region.json
    type: json
    schema: Aggregated counts by year + region
  - name: by_age.json
    to: embuild-analyses/analyses/bouwondernemers/results/by_age.json
    type: json
    schema: Aggregated counts by year + region + age-group
  - name: lookups.json
    to: embuild-analyses/analyses/bouwondernemers/results/lookups.json
    type: json
    schema: Lookup tables for NACE, regions, genders and age ranges
interfaces:
  - name: BouwondernemersDashboard
    path: embuild-analyses/src/components/analyses/bouwondernemers/BouwondernemersDashboard.tsx
stability: active
owner: Unknown
safe_to_delete_when: When the analysis is removed from the blog
last_reviewed: 2025-01-10
---

# Analysis: Bouwondernemers

Analyse van zelfstandige ondernemers in de bouwsector (NACE = F) met uitsplitsingen naar subsector, regio, leeftijd en geslacht. Data wordt gehaald uit het Statbel "Ondernemers - Datalab" open data export (TF_ENTREP_NACE_year).

## Overview

- Periode: 2017–2022 (script zoekt automatisch naar recentere jaren)
- Outputs: geaggregeerde JSON/CSV-bestanden in `results/` en lookups

## Data processing

- `src/process_data.py` downloadt (indien nodig) de Statbel zip-archieven, extraheert het pipe-delimited bestand en combineert jaren. Het script filtert op NACE-codes die beginnen met `F` (bouw) en produceert de `by_*.json` resultaten en `lookups.json`.
- Het script update ook de frontmatter `sourcePublicationDate` in `content.mdx` naar de laatste beschikbare jaar (bijv. `2022-12-31`).

## Related components

- `embuild-analyses/src/components/analyses/bouwondernemers/BouwondernemersDashboard.tsx`

## How to run

```bash
python embuild-analyses/analyses/bouwondernemers/src/process_data.py
```

The script will:
- Try to download TF_ENTREP_NACE_<year>.zip for years in a range
- Extract the data files and combine them
- Write `by_sector.json`, `by_gender.json`, `by_region.json`, `by_age.json` and `lookups.json` to `results/`

## Data sources

- Statbel — Ondernemers Datalab (https://statbel.fgov.be/nl/open-data/ondernemers-datalab)

## Notes

- The script is resilient to missing years (404s) and checks a few years beyond expected max to pick up newer releases.
- Ensure network access when running the script so it can download the zip archives.
