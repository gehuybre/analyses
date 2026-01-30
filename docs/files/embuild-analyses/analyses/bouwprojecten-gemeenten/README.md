---
kind: file
path: embuild-analyses/analyses/bouwprojecten-gemeenten
role: Analysis
inputs:
  - name: meerjarenplan projecten.csv
    from: embuild-analyses/analyses/bouwprojecten-gemeenten/data/meerjarenplan projecten.csv
    type: csv
    schema: CSV from Agentschap Binnenlands Bestuur containing project-level fields (Bestuur, Beleidsdoelst., Actieplan, Actie, yearly amounts 2026-2031)
    required: false
  - name: refnis.csv
    from: shared-data/nis/refnis.csv
    type: csv
    schema: RefNIS municipality lookup (CD_REFNIS, TX_REFNIS_NL, ...)
    required: true
outputs:
  - name: projects_2026_full.parquet
    to: embuild-analyses/analyses/bouwprojecten-gemeenten/results/projects_2026_full.parquet
    type: parquet
    schema: Full project table with municipality, NIS, action codes, yearly amounts, categories
  - name: projects_2026_chunk_*.json
    to: public/data/bouwprojecten-gemeenten/projects_2026_chunk_<n>.json
    type: json
    schema: Chunked project lists for browser consumption (used by ProjectBrowser)
  - name: projects_metadata.json
    to: public/data/bouwprojecten-gemeenten/projects_metadata.json
    type: json
    schema: Metadata about total projects, total amount, chunk count and category breakdown
interfaces:
  - name: ProjectBrowser
    path: embuild-analyses/src/components/analyses/bouwprojecten-gemeenten/ProjectBrowser.tsx
stability: active
owner: Unknown
safe_to_delete_when: When the analysis is removed from the blog
last_reviewed: 2026-01-09
---

# Analysis: Gemeentelijke bouwprojecten (Vlaanderen)

Deze analyse verzamelt concrete investeringsprojecten uit gemeentelijke meerjarenplannen (legislatuur 2026–2031). De dataset bevat projectbeschrijvingen, geplande uitgaven per jaar (2026–2031) en automatische categorisatie naar bouw-/infrastructuur-domeinen.

## Overview

- Aantal projecten (sample): 11.095
- Totaalbedrag (sample): €16.0 miljard
- Data is afkomstig van het Agentschap Binnenlands Bestuur (BBC/DR gemeentelijke meerjarenplannen)

## Data processing

De verwerking gebeurt met de script(s) in `src/`:

- `src/process_project_details.py` — parses de CSV met multi-line tekstvelden, extraheert codes/omschrijvingen (BD/AP/AC), parseert jaartallen 2026–2031, classificeert projecten en schrijft JSON chunkbestanden + metadata naar `public/data/bouwprojecten-gemeenten/`.
- `src/category_keywords.py` — lijst van categorie-definities en keyword-based classificatie.


## Outputs / consumption

- De webinterface (`ProjectBrowser`) laadt eerst `projects_metadata.json`, en laadt vervolgens `projects_2026_chunk_<n>.json` per chunk met fetch requests.
- Er is ook een full parquet snapshot in `results/` (`projects_2026_full.parquet`) bedoeld voor analysis and archival.

## Related components

- `embuild-analyses/src/components/analyses/bouwprojecten-gemeenten/ProjectBrowser.tsx`
- `embuild-analyses/src/components/analyses/bouwprojecten-gemeenten/BouwprojectenEmbed.tsx`

## How to run

From repository root:

```bash
# (1) Put or download the input CSV to `analyses/bouwprojecten-gemeenten/data/meerjarenplan projecten.csv`
# (2) Run the processor
python embuild-analyses/analyses/bouwprojecten-gemeenten/src/process_project_details.py
```

Het script schrijft chunked JSON bestanden en `projects_metadata.json` to `public/data/bouwprojecten-gemeenten/`.

> Note: The processor expects a RefNIS lookup at `shared-data/nis/refnis.csv` to resolve municipality names to NIS codes.

## Data sources

- Agentschap Binnenlands Bestuur — jaarrekeningen / meerjarenplannen (BBC-DR)

## Notes

- Projectcategorisatie is keyword-gebaseerd; sommige projecten kunnen in meerdere categorieën vallen of worden gelabeld als `overige`.
- Input CSV files are sometimes provided by hand or harvested in separate scripts / processes; they are not always committed to the repo.
