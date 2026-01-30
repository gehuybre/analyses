# Documentation Index

## Handleidingen

- [Blog Post Structuur](BLOG-POST-STRUCTUUR.md) - Hoe een analyse/blogbericht moet worden opgezet
- [Git LFS](GIT-LFS.md) - Huidige LFS-regels en gebruik
- [Embed how‑to](files/embuild-analyses/embed-howto.md) - Stappen om een sectie embeddable te maken (config, tests)
- [Sections how‑to](files/sections-howto.md) - Wanneer `AnalysisSection` of `TimeSeriesSection` te gebruiken
- [FilterableTable — gebruik](files/src/components/analyses/shared/FilterableTable.md) - Voorbeeld en data shape
- [MunicipalityMap — input & tips](files/src/components/analyses/shared/MunicipalityMap.md) - Geo input en common pitfalls

## Analyses

- [Bouwondernemers](files/embuild-analyses/analyses/bouwondernemers/README.md) - Zelfstandige ondernemers in de bouwsector
- [Energiekaart Premies](files/embuild-analyses/analyses/energiekaart-premies/README.md) - Overzicht van energiepremies per gemeente
- [Faillissementen](files/embuild-analyses/analyses/faillissementen/README.md) - Statistieken over faillissementen
- [Gebouwenpark](files/embuild-analyses/analyses/gebouwenpark/README.md) - Belgische gebouwenpark evolutie sinds 1995
- [Gemeentelijke Investeringen](files/embuild-analyses/analyses/gemeentelijke-investeringen/README.md) - Analyse van investeringen door gemeenten
- [Huishoudensgroei](files/embuild-analyses/analyses/huishoudensgroei/README.md) - Huishoudensvooruitzichten per gemeente in Vlaanderen (2010-2040)
- [Prijsherziening Index I 2021](files/embuild-analyses/analyses/prijsherziening-index-i-2021/README.md) - Analyse van de prijsherzieningsindex
- [Starters-Stoppers](files/embuild-analyses/analyses/starters-stoppers/README.md) - Startende en stoppende ondernemingen
- [Vastgoed Verkopen](files/embuild-analyses/analyses/vastgoed-verkopen/README.md) - Vastgoedtransacties en prijzen per type woning
- [Vergunningen Aanvragen](files/embuild-analyses/analyses/vergunningen-aanvragen/README.md) - Analyse van bouwvergunningsaanvragen
- [Vergunningen goedkeuringen](files/embuild-analyses/analyses/vergunningen-goedkeuringen/README.md) - Bouwvergunningen nieuwbouw en renovatie

## Workflows

- [Project Setup](workflows/WF-project-setup.md)
- [Deploy](workflows/WF-deploy.md)
- [Embed System](workflows/WF-embed-system.md) - Iframe embed configuration and usage
- [Filter Sync Implementation](workflows/WF-filter-sync-implementation.md) - Centralized filter defaults and validation pattern
- [Press References](workflows/WF-press-references.md) - Adding press release citations to blog posts
- [Bouwondernemers](workflows/WF-bouwondernemers.md) - Construction entrepreneurs data processing from Statbel
- [Vergunningen goedkeuringen](workflows/WF-vergunningen-goedkeuringen.md)
- [Update Vergunningen Data](workflows/WF-update-vergunningen-data.md)
- [Update Starters-Stoppers Data](workflows/WF-update-starters-stoppers-data.md)
- [Gemeentelijke Investeringen](workflows/WF-gemeentelijke-investeringen.md) - Municipal investment data processing from BBC-DR system
- [Documentation Example](workflows/WF-example.md) - Example workflow demonstrating how to document changes and entrypoints

## Key entrypoints

- [src/cli/main.py](files/src/cli/main.py.md): CLI entrypoint used for project commands (example)

## Files

- [contentlayer.config.ts](files/embuild-analyses/contentlayer.config.ts.md)
- [next.config.ts](files/embuild-analyses/next.config.ts.md)
- [package.json](files/embuild-analyses/package.json.md)
- [requirements.txt](files/requirements.txt.md)
- [run_blog.py](files/run_blog.py.md)
- [Shared Data README](files/embuild-analyses/shared-data/README.md)
- [LAU GeoPackage](files/embuild-analyses/shared-data/geo/LAU_RG_01M_2024_4326.gpkg.md)
- [NUTS Level 1 GeoJSON](files/embuild-analyses/shared-data/geo/NUTS_RG_01M_2021_4326_LEVL_1.geojson.md)
- [NACEBEL 2025](files/embuild-analyses/shared-data/nace/NACEBEL_2025.xlsx.md)
- [NACE Codes CSV](files/embuild-analyses/shared-data/nace/nace_codes.csv.md)
- [REFNIS Codes](files/embuild-analyses/shared-data/nis/TU_COM_REFNIS.txt.md)
- [REFNIS Codes CSV](files/embuild-analyses/shared-data/nis/refnis.csv.md)
- [Shared Data Processor](files/embuild-analyses/shared-data/process_shared_data.py.md)
- [VergunningenDashboard.tsx](files/embuild-analyses/src/components/analyses/vergunningen-goedkeuringen/VergunningenDashboard.tsx.md)
- [GeoContext.tsx](files/embuild-analyses/src/components/analyses/shared/GeoContext.tsx.md)
- [GeoFilter.tsx](files/embuild-analyses/src/components/analyses/shared/GeoFilter.tsx.md)
- [GeoFilterInline.tsx](files/embuild-analyses/src/components/analyses/shared/GeoFilterInline.tsx.md)
- [MunicipalityMap.tsx](files/embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx.md) - **Unified map component** (municipality-only rendering with optional province boundaries)
- [MunicipalitySearch.tsx](files/embuild-analyses/src/components/analyses/shared/MunicipalitySearch.tsx.md) - Municipality search with autocomplete
- [MapControls.tsx](files/embuild-analyses/src/components/analyses/shared/MapControls.tsx.md)
- [MapLegend.tsx](files/embuild-analyses/src/components/analyses/shared/MapLegend.tsx.md)
- [TimeSlider.tsx](files/embuild-analyses/src/components/analyses/shared/TimeSlider.tsx.md)
- [ExportButtons.tsx](files/embuild-analyses/src/components/analyses/shared/ExportButtons.tsx.md) - CSV download and embed code generation
- [EmbeddableSection.tsx](files/embuild-analyses/src/components/analyses/shared/EmbeddableSection.tsx.md) - Standalone section for iframe embeds
- [TimeSeriesSection.tsx](files/embuild-analyses/src/components/analyses/shared/TimeSeriesSection.tsx.md)
- [AnalysisLayout.tsx](files/embuild-analyses/src/components/analyses/AnalysisLayout.tsx.md)
- [Embed Route](files/embuild-analyses/src/app/embed/README.md) - Iframe embedding endpoint
- [embed-config.ts](files/embuild-analyses/src/lib/embed-config.ts.md) - Centralized embed configuration
- [geo-utils.ts](files/embuild-analyses/src/lib/geo-utils.ts.md) - Geographic utilities (regions, provinces, municipalities)
- [map-utils.ts](files/embuild-analyses/src/lib/map-utils.ts.md) - **Data expansion utilities** for province/region to municipality conversion
- [chart-theme.ts](files/embuild-analyses/src/lib/chart-theme.ts.md) - Central theme constants
- [EnergiekaartChart.tsx](files/embuild-analyses/src/components/analyses/energiekaart-premies/EnergiekaartChart.tsx.md)
- [EnergiekaartDashboard.tsx](files/embuild-analyses/src/components/analyses/energiekaart-premies/EnergiekaartDashboard.tsx.md)
- [EnergiekaartEmbed.tsx](files/embuild-analyses/src/components/analyses/energiekaart-premies/EnergiekaartEmbed.tsx.md)
- [EnergiekaartSection.tsx](files/embuild-analyses/src/components/analyses/energiekaart-premies/EnergiekaartSection.tsx.md)
- [EnergiekaartTable.tsx](files/embuild-analyses/src/components/analyses/energiekaart-premies/EnergiekaartTable.tsx.md)
- [MeasureFilter.tsx](files/embuild-analyses/src/components/analyses/energiekaart-premies/MeasureFilter.tsx.md)
- [FaillissementenDashboard.tsx](files/embuild-analyses/src/components/analyses/faillissementen/FaillissementenDashboard.tsx.md)
- [FaillissementenEmbed.tsx](files/embuild-analyses/src/components/analyses/faillissementen/FaillissementenEmbed.tsx.md)
- [HuishoudensDashboard.tsx](files/embuild-analyses/src/components/analyses/huishoudensgroei/HuishoudensDashboard.tsx.md)
- [HuishoudensgroeiEmbed.tsx](files/embuild-analyses/src/components/analyses/huishoudensgroei/HuishoudensgroeiEmbed.tsx.md)
- [PrijsherzieningDashboard.tsx](files/embuild-analyses/src/components/analyses/prijsherziening/PrijsherzieningDashboard.tsx.md)
- [StartersStoppersDashboard.tsx](files/embuild-analyses/src/components/analyses/starters-stoppers/StartersStoppersDashboard.tsx.md)
- [StartersStoppersEmbed.tsx](files/embuild-analyses/src/components/analyses/starters-stoppers/StartersStoppersEmbed.tsx.md)
- [VastgoedDashboard.tsx](files/embuild-analyses/src/components/analyses/vastgoed-verkopen/VastgoedDashboard.tsx.md)
- [VastgoedVerkopenEmbed.tsx](files/embuild-analyses/src/components/analyses/vastgoed-verkopen/VastgoedVerkopenEmbed.tsx.md)
- [VergunningenDashboard.tsx (Aanvragen)](files/embuild-analyses/src/components/analyses/vergunningen-aanvragen/VergunningenDashboard.tsx.md)
- [VergunningenAanvragenEmbed.tsx](files/embuild-analyses/src/components/analyses/vergunningen-aanvragen/VergunningenAanvragenEmbed.tsx.md)
- [GebouwenDashboard.tsx](files/embuild-analyses/src/components/analyses/gebouwenpark/GebouwenDashboard.tsx.md)
- [GebouwenparkEmbed.tsx](files/embuild-analyses/src/components/analyses/gebouwenpark/GebouwenparkEmbed.tsx.md)
- [GebouwenChart.tsx](files/embuild-analyses/src/components/analyses/gebouwenpark/GebouwenChart.tsx.md)
- [GebouwenTable.tsx](files/embuild-analyses/src/components/analyses/gebouwenpark/GebouwenTable.tsx.md)
- [gebouwenpark/types.ts](files/embuild-analyses/src/components/analyses/gebouwenpark/types.ts.md)

## Core Components

- [EmbedAutoResize.tsx](files/embuild-analyses/src/components/EmbedAutoResize.tsx.md) - Auto-resize for iframe embeds
- [EmbedErrorBoundary.tsx](files/embuild-analyses/src/components/EmbedErrorBoundary.tsx.md) - Error handling for embeds
- [EmbedParentResizeListener.tsx](files/embuild-analyses/src/components/EmbedParentResizeListener.tsx.md) - Parent-side iframe resizing
- [mdx-content.tsx](files/embuild-analyses/src/components/mdx-content.tsx.md) - MDX content renderer

## Shared Analysis Components

- [AnalysisSection.tsx](files/embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx.md)
- [FilterableChart.tsx](files/embuild-analyses/src/components/analyses/shared/FilterableChart.tsx.md)
- [FilterableTable.tsx](files/embuild-analyses/src/components/analyses/shared/FilterableTable.tsx.md)
- [MapSection.tsx](files/embuild-analyses/src/components/analyses/shared/MapSection.tsx.md) - Complete map with search

## Library Utilities

- [embed-data-registry.ts](files/embuild-analyses/src/lib/embed-data-registry.ts.md) - Centralized embed data imports
- [embed-data-transformers.ts](files/embuild-analyses/src/lib/embed-data-transformers.ts.md) - Data transformation utilities
- [embed-path-validation.ts](files/embuild-analyses/src/lib/embed-path-validation.ts.md) - Path security validation
- [embed-types.ts](files/embuild-analyses/src/lib/embed-types.ts.md) - TypeScript types for embed system
- [name-utils.ts](files/embuild-analyses/src/lib/name-utils.ts.md) - Municipality name formatting
- [quarterly-narrative.ts](files/embuild-analyses/src/lib/quarterly-narrative.ts.md) - Automated trend narratives
- [utils.ts](files/embuild-analyses/src/lib/utils.ts.md) - Tailwind class merging

## Scripts

- [generate_province_map.py](files/scripts/generate_province_map.py.md) - Generate province GeoJSON from municipalities
- [update_publication_date.py](files/scripts/update_publication_date.py.md) - Scrape and update Statbel publication dates
- [validate-embed-paths.ts](files/embuild-analyses/scripts/validate-embed-paths.ts.md) - Build-time embed config validation
- [check-faillissementen-geo-join.js](files/embuild-analyses/scripts/check-faillissementen-geo-join.js.md) - Geo-join validation for faillissementen
- [serve-export-with-basepath.mjs](files/embuild-analyses/scripts/serve-export-with-basepath.mjs.md) - Local server for testing static exports

## Data Processing Scripts

- [process_gebouwen.py](files/embuild-analyses/analyses/gebouwenpark/src/process_gebouwen.py.md) - Gebouwenpark data processing
- [inspect.py](files/embuild-analyses/analyses/gebouwenpark/src/inspect.py.md) - Gebouwenpark data inspection utility
- [process_data.py (vergunningen-goedkeuringen)](files/embuild-analyses/analyses/vergunningen-goedkeuringen/src/process_data.py.md)
