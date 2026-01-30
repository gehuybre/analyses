---
kind: workflow
id: WF-vergunningen-goedkeuringen
owner: Unknown
status: active
trigger: Manual execution of script
inputs:
  - name: BV_opendata_251125_082807.txt
    from: embuild-analyses/analyses/vergunningen-goedkeuringen/data/
    type: file
    schema: Pipe-delimited text file with building permit data
    required: true
outputs:
  - name: data_quarterly.json
    to: embuild-analyses/analyses/vergunningen-goedkeuringen/results/
    type: json
    schema: Array of objects {y, q, m, ren, new}
  - name: data_monthly.json
    to: embuild-analyses/analyses/vergunningen-goedkeuringen/results/
    type: json
    schema: Array of objects {y, mo, m, ren, new}
  - name: municipalities.json
    to: embuild-analyses/analyses/vergunningen-goedkeuringen/results/
    type: json
    schema: Array of objects {code, name}
entrypoints:
  - embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py
files:
  - embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py
  - embuild-analyses/src/components/analyses/vergunningen-goedkeuringen/VergunningenDashboard.tsx
  - embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx
  - embuild-analyses/src/components/analyses/shared/GeoContext.tsx
  - embuild-analyses/src/components/analyses/shared/GeoFilter.tsx
  - embuild-analyses/src/components/analyses/shared/FilterableChart.tsx
  - embuild-analyses/src/components/analyses/shared/FilterableTable.tsx
  - embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx
  - embuild-analyses/src/lib/geo-utils.ts
last_reviewed: 2025-12-14
---

# WF: Vergunningen goedkeuringen Analysis

## Purpose
This workflow processes raw building permits data to generate interactive dashboards for the "Vergunningen goedkeuringen" blog post. It focuses on residential renovation and new construction trends.

## Trigger
Manual execution of the `process_data.py` script.

## Inputs
*   **BV_opendata_251125_082807.txt**: A raw text file containing building permit records, located in the `data/` directory.

## Outputs
*   **data_quarterly.json**: Aggregated quarterly data for renovation and new construction, keyed by municipality.
*   **data_monthly.json**: Aggregated monthly data for renovation and new construction, keyed by municipality.
*   **municipalities.json**: A lookup list of municipality codes and names.

## Steps (high level)
1.  **Read Data**: Loads the raw pipe-delimited text file.
2.  **Filter**: Selects records for municipalities (Level 5) and excludes yearly totals.
   
    **Note**: In the raw data, `CD_PERIOD` = 0 represents yearly totals, which are excluded from the analysis.
3.  **Transform**: Calculates quarters and aggregates renovation and new construction counts.
4.  **Export**: Saves the aggregated data and municipality list to JSON files for the frontend.
5.  **Visualize**: The React dashboard consumes these JSON files to render charts, tables, and maps. It uses `GeoContext` and `GeoFilter` to allow users to explore data at Region, Province, and Municipality levels.

## Files involved
*   `embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py`
*   `embuild-analyses/src/components/analyses/vergunningen-goedkeuringen/VergunningenDashboard.tsx`
*   `embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx`
*   `embuild-analyses/src/components/analyses/shared/GeoContext.tsx`
*   `embuild-analyses/src/components/analyses/shared/GeoFilter.tsx`
*   `embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx`
*   `embuild-analyses/src/lib/geo-utils.ts`
