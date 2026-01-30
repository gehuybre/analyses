---
kind: workflow
id: WF-bouwondernemers
owner: Unknown
status: active
trigger: Manual
inputs:
  - name: INPUT_URL
    type: url
    required: true
    schema: Zip file from Statbel Ondernemers Datalab (entrepreneurs by sector, region, gender, age)
  - name: MAX_YEAR
    type: integer
    required: false
    schema: Latest expected year (default 2022), script checks up to MAX_YEAR + 5
outputs:
  - name: by_sector.json
    type: json
    to: embuild-analyses/analyses/bouwondernemers/results/
    schema: Array with fields y (year), r (region), s (NACE sector), v (value)
  - name: by_gender.json
    type: json
    to: embuild-analyses/analyses/bouwondernemers/results/
    schema: Array with fields y (year), r (region), g (gender code), v (value)
  - name: by_region.json
    type: json
    to: embuild-analyses/analyses/bouwondernemers/results/
    schema: Array with fields y (year), r (region), v (value)
  - name: by_age.json
    type: json
    to: embuild-analyses/analyses/bouwondernemers/results/
    schema: Array with fields y (year), r (region), a (age range code), v (value)
  - name: lookups.json
    type: json
    to: embuild-analyses/analyses/bouwondernemers/results/
    schema: Lookup tables for NACE sectors, gender codes, and age ranges (NL/EN labels)
entrypoints:
  - embuild-analyses/analyses/bouwondernemers/src/process_data.py
files:
  - embuild-analyses/analyses/bouwondernemers/src/process_data.py
  - embuild-analyses/analyses/bouwondernemers/results/
  - embuild-analyses/analyses/bouwondernemers/content.mdx
  - embuild-analyses/src/components/analyses/bouwondernemers/
last_reviewed: 2025-01-10
---

# Bouwondernemers Data Processing

This workflow processes data from Statbel's "Ondernemers Datalab" to analyze self-employed entrepreneurs in the Belgian construction sector (NACE F-codes). The data is broken down by subsector, gender, region, and age range for the period 2017-2022.

## Data Source

- **Provider**: Statbel (Belgian Federal Planning Bureau)
- **Dataset**: Ondernemers - Datalab
- **URL**: https://statbel.fgov.be/nl/open-data/ondernemers-datalab
- **Format**: ZIP file containing tab-separated TXT files
- **Publication date**: 2022-12-31

## Processing Steps

The `process_data.py` script performs the following operations:

### 1. Data Download and Extraction
- Downloads ZIP file from Statbel URL
- Extracts all `.txt` files (tab-separated format)
- Handles HTTP 404 errors gracefully for missing years
- Automatically checks for newer years beyond MAX_YEAR (up to MAX_YEAR + 5)

### 2. Data Filtering
Filters the raw data to focus on construction entrepreneurs:
- **NACE Sector**: Only F-codes (construction sector)
- **Worker Class**: `'3'` (self-employed entrepreneurs)
- **Legal Type**: All types
- **Region**: Uses REFNIS codes (1000=Belgium, 2000=Flemish, 3000=Wallonia, 4000=Brussels)

### 3. Region Code Normalization
Converts various REFNIS region codes to standardized format:
- `'10000'` → `'1000'` (Belgium)
- `'20001'` → `'2000'` (Flemish Region)
- `'30002'` → `'3000'` (Walloon Region)
- `'40003'` → `'4000'` (Brussels-Capital Region)

### 4. Data Aggregation
Creates four separate aggregation views:

#### by_sector.json
- Dimensions: year, region, NACE sector (F-codes only)
- Aggregated by summing entrepreneur counts
- Used for: Overview section and sector time series

#### by_gender.json
- Dimensions: year, region, gender
- Aggregated by gender code
- Used for: Gender breakdown time series

#### by_region.json
- Dimensions: year, region
- Total counts per region
- Used for: Regional comparison time series

#### by_age.json
- Dimensions: year, region, age range
- Aggregated by age categories
- Used for: Age distribution time series

### 5. Lookup Tables Generation
Creates `lookups.json` with human-readable labels:
- **NACE codes**: Dutch and English labels for construction subsectors
- **Gender codes**: Male/Female labels
- **Age ranges**: Age category descriptions

## Output Format

All JSON files use compact field names to reduce file size:
- `y`: year (integer)
- `r`: region code (string, REFNIS code)
- `s`: sector code (string, NACE code)
- `g`: gender code (string)
- `a`: age range code (string)
- `v`: value (integer, count of entrepreneurs)

Example record from `by_sector.json`:
```json
{
  "y": 2022,
  "r": "2000",
  "s": "F41",
  "v": 15432
}
```

## Dashboard Features

The `BouwondernemersDashboard` component (`embuild-analyses/src/components/analyses/bouwondernemers/BouwondernemersDashboard.tsx`) provides:

1. **Overview Section**:
   - Geographic filter (Belgium/Region/Province via `GeoFilterInline`)
   - Sector filter (all subsectors or specific F-code)
   - Absolute/Relative toggle (counts vs percentages)
   - Chart and table views with CSV export

2. **Subsector Time Series**:
   - Multi-line chart showing evolution of each F-code subsector
   - Geographic filter
   - Chart and table views
   - Uses short sector labels when configured in `embuild-analyses/src/lib/sector-short-labels.ts`

3. **Gender Time Series**:
   - Male/Female breakdown over time
   - Geographic filter
   - Chart and table views

4. **Regional Time Series**:
   - Comparison across Flanders, Wallonia, and Brussels
   - No geographic filter (shows all regions)
   - Chart and table views

5. **Age Time Series**:
   - Distribution across age ranges
   - Geographic filter
   - Chart and table views

## Sector Short Labels

If the default NACE sector labels are too long, you can define short overrides in:

`embuild-analyses/src/lib/sector-short-labels.ts`

When a code is present in the mapping, the dashboard uses the short label in:
- sector filter dropdown
- chart legends and tooltips
- sector tables

## Running the Script

To update the data manually:

```bash
# From repository root
cd embuild-analyses/analyses/bouwondernemers/src
python process_data.py
```

The script will:
1. Download the latest data from Statbel
2. Process and aggregate the data
3. Write results to `../results/`
4. Report any errors or warnings

## Future Updates

When new data becomes available:
1. Update `MAX_YEAR` constant in `process_data.py` if needed
2. Run the processing script
3. Verify the output files
4. Update `sourcePublicationDate` in `content.mdx` if the data publication date changes
5. Commit and deploy

The script is designed to be future-proof and will automatically check for years beyond `MAX_YEAR + 5`.
