---
kind: workflow
id: WF-gemeentelijke-investeringen
owner: Unknown
status: active
trigger: Manual
inputs:
  - name: BBC-DR Excel Files
    from: embuild-analyses/analyses/gemeentelijke-investeringen/data/
    type: file
    schema: Four Excel files with municipal investment data from Flemish Government BBC-DR system
    required: true
outputs:
  - name: Investment Results
    to: embuild-analyses/analyses/gemeentelijke-investeringen/results/
    type: json
    schema: Processed investment data aggregated by domain, category, municipality, and time
  - name: Metadata
    to: embuild-analyses/analyses/gemeentelijke-investeringen/results/metadata.json
    type: json
    schema: Data quality metrics and truncation flags
entrypoints:
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/process_investments.py
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations.py
files:
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/process_investments.py
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/prepare_visualizations.py
  - embuild-analyses/analyses/gemeentelijke-investeringen/src/check_data.py
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/mjp 2014 bv.csv
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/mjp 2020 bv.csv
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/mjp bv 26.csv
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/mjp rek 2014.csv
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/mjp rek 2020.csv
  - embuild-analyses/analyses/gemeentelijke-investeringen/data/mjp rek 2026.csv
  - embuild-analyses/analyses/gemeentelijke-investeringen/results/
  - embuild-analyses/public/data/gemeentelijke-investeringen/
  - embuild-analyses/analyses/gemeentelijke-investeringen/content.mdx
  - .github/workflows/update-gemeentelijke-investeringen-data.yml
last_reviewed: 2026-01-12
---

# WF: Gemeentelijke Investeringen Data Processing

## Purpose

Processes municipal investment data from the Flemish Government's BBC-DR (Beleids- en Beheerscyclus - Digitale Rapportering) system to generate interactive visualizations showing investment patterns across municipalities, policy domains (beleidsdomeinen), and cost categories (kostenposten).

The workflow transforms complex Excel exports into clean JSON datasets suitable for web visualization, enabling analysis of municipal investment priorities across Flanders.

## Trigger

Manual execution. The data is sourced from BI application exports from the BBC-DR system and must be manually downloaded and placed in the data directory before running the processor.

## Inputs

### Source Data Files
Six CSV files exported from the Agentschap Binnenlands Bestuur BI application for three rapportjaren (2014, 2020, 2026):

**BV (Beleidsdomein) Files:**
1. **mjp 2014 bv.csv**: Legislatuur 2014-2020 investments by policy domain (BV_domein/BV_subdomein/Beleidsveld)
2. **mjp 2020 bv.csv**: Legislatuur 2020-2026 investments by policy domain
3. **mjp bv 26.csv**: Legislatuur 2026-2032 investments by policy domain

**REK (Economische Rekening) Files:**
4. **mjp rek 2014.csv**: Legislatuur 2014-2020 investments by accounting category (Niveau 1-3, Alg. rekening)
5. **mjp rek 2020.csv**: Legislatuur 2020-2026 investments by accounting category
6. **mjp rek 2026.csv**: Legislatuur 2026-2032 investments by accounting category

Each file contains:
- Metadata rows (Type rapport, Rapportjaar, Boekjaar, hierarchical codes)
- NIIntermediate Parquet Files (results/)
- `investments_bv.parquet`: Processed BV data (all rapportjaren, ~125k records)
- `investments_rek.parquet`: Processed REK data (all rapportjaren, ~90k records)

### Visualization Data Files (public/data/gemeentelijke-investeringen/)

**BV (Beleidsdomein) Data:**
- `bv_lookups.json`: Lookup tables for BV_domein, BV_subdomein, Beleidsveld, and municipalities
- `bv_vlaanderen_data.json`: Aggregated Vlaanderen-level totals per rapportjaar
- `bv_municipality_data_chunk_*.json`: Municipality-level data split into chunks (5000 records each)

**REK (Economische Rekening) Data:**
- `rek_lookups.json`: Lookup tables for Niveau_3, Alg_rekening, and municipalities  
- `rek_vlaanderen_data.json`: Aggregated Vlaanderen-level totals per rapportjaar
- `rek_municipality_data_chunk_*.json`: Municipality-level data split into chunks (5000 records each)

**Metadata:**
- `metadata.json`: Data quality metrics including:
  - Rapportjaren available (2014, 2020, 2026)
  - Total municipalities covered
  - Counts of BV domains, subdomeins, beleidsvelds
  - Counts of REK niveau3s and alg_rekenings
  - Chunk information for data loading
  - **is_kostenpost_truncated**: Explicit flag indicating if kostenpost data is incomplete
  - **kostenpost_municipalities**: Count of municipalities with kostenpost data

### Full Data (CSV)
- `investments_by_domain.csv`: Complete raw domain data
- `investments_by_category.csv`: Complete raw category data

### Content Update
- `content.mdx`: Frontmatter date field automatically updated to match latest data year

## Steps (high level)

1. **Extract and Parse**: Read Excel files, identify metadata rows (years, domains, categories) and municipality columns
2. **Filter and Clean**: Remove aggregates ("Total"), OCMW duplicates, and invalid entries; parse domain/category codes
3. **NIS Code Mapping**: Match municipality names to NIS codes using fuzzy matching and normalization (handles diacritics, case variations)
4. **Validation**: Cross-check consistency between Beleidsveld and Kostenpost totals (warns if >1% discrepancy)
5. **Truncation Detection**: Calculate `is_kostenpost_truncated` flag based on municipality coverage ratio
6. **Aggregate**: Generate Vlaanderen-level time series by summing municipality data and recalculating per capita metrics
7. **Filter Latest**: Extract latest year data for map visualizations
8. **Write Outputs**: Serialize to JSON with proper formatting and update metadata

## Data Quality Notes
### 1. process_investments.py

**REK File Processing:**
1. Locate NIS-code row in CSV (typically row 12)
2. Extract metadata rows (Boekjaar, Niveau 1-3, Alg. rekening)
3. Filter for:
   - Flemish municipalities only (NIS codes starting with 1,2,3,4,7)
   - Investeringen only (any Niveau contains "investering")
   - Positive values only
4. Apply 2026 municipality mergers (NIS_MERGERS mapping)
5. Pivot to wide format with Totaal and Per_inwoner columns
6. Save to `investments_rek.parquet`

**BV File Processing:**
1. Locate NIS-code row in CSV (typically row 6)
2. Extract metadata rows (Boekjaar, BV_domein, BV_subdomein, Beleidsveld)
3. Process in chunks (200 rows) to handle large files
4. Filter for:
   - Flemish municipalities only
   - Positive values only
5. Apply 2026 municipality mergers
6. Pivot to wide format with Totaal and Per_inwoner columns
7. Save to `investments_bv.parquet`

**Note:** All jaren (2014, 2020, 2026) have complete Beleidsveld data in column 6.

### 2. prepare_visualizations.py

1. Load parquet files
2. **Aggregate by Rapportjaar**: Sum all boekjaren within each 6-year legislatuur
3. **Create Lookups**: Extract unique BV_domein, BV_subdomein, Beleidsveld, Niveau_3, Alg_rekening
4. **Generate Municipality Data**: Full dataset per rapportjaar with NIS codes
5. **Generate Vlaanderen Totals**: Sum across all municipalities per rapportjaar
6. **Apply 2025 Municipality Mergers**: Use NIS_MERGERS_LOOKUP and NEW_MUNI_NAMES
7. **Chunk Large Files**: Split municipality data into 5000-record chunks
8. **Write JSON**: Save with NaN handling and pretty formatting

## Data Quality Notes

**Beleidsveld Coverage (verified 2026-01-12):**
- 2014: 138/138 records (100%)
- 2020: 141/141 records (100%)  
- 2026: 136/136 records (100%)
- Total unique beleidsvelds: 145 across all years

**Municipality Coverage:**
- 285 Flemish municipalities across all rapportjaren
- NIS 2026 mergers applied: 13 source municipalities → 12 target municipalities
- All data aggregated to post-2026 municipality boundaries

**Data Structure:**
- REK data: ~90k records → 18.6k aggregated records (per rapportjaar)
- BV data: ~125k records → 29.7k aggregated records (per rapportjaar)
- Chunk size: 5000 records per JSON file for efficient loading