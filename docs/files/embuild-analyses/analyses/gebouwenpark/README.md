---
kind: file
path: embuild-analyses/analyses/gebouwenpark
role: Analysis
workflows: []
inputs:
  - name: building_stock_open_data.txt
    from: embuild-analyses/analyses/gebouwenpark/data/building_stock_open_data.txt
    type: csv
    schema: Statbel building stock data with columns for year, region, building type, counts
    required: true
outputs:
  - name: stats_2025.json
    to: embuild-analyses/analyses/gebouwenpark/results/stats_2025.json
    type: json
    schema: Processed building statistics including snapshot and time series data
interfaces: []
stability: active
owner: Unknown
safe_to_delete_when: When gebouwenpark analysis is removed from the blog
superseded_by: null
last_reviewed: 2026-01-05
---

# Analysis: Gebouwenpark

Analyse van het Belgische gebouwenpark op 1 januari 2025, gebaseerd op kadastrale gegevens.

## Overview

This analysis examines the Belgian building stock as of January 1, 2025. It tracks the total number of buildings and residential units, their evolution since 1995, and distribution by building type (closed-row houses, semi-detached houses, detached houses, and apartment buildings).

## Related Components

- [GebouwenDashboard.tsx](../../src/components/analyses/gebouwenpark/GebouwenDashboard.tsx.md)
- [GebouwenparkEmbed.tsx](../../src/components/analyses/gebouwenpark/GebouwenparkEmbed.tsx.md)
- [GebouwenChart.tsx](../../src/components/analyses/gebouwenpark/GebouwenChart.tsx.md)
- [GebouwenTable.tsx](../../src/components/analyses/gebouwenpark/GebouwenTable.tsx.md)

## Data Sources

- Statbel (Kadastrale statistiek van het bestand van de gebouwen)
- Source URL: https://statbel.fgov.be/nl/themas/bouwen-wonen/gebouwenpark
