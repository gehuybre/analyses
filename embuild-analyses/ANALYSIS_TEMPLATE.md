# Template & UI-afspraken voor analyses

## 1) `content.mdx` structuur (titel/datum/summary komen uit frontmatter)

Maak een nieuwe analyse in `embuild-analyses/analyses/<slug>/content.mdx`:

```mdx
---
title: Jouw titel
date: 2025-01-01
summary: Korte uitleg (1–2 zinnen) die onder de titel komt.
tags: [tag1, tag2]
slug: jouw-slug
sourceProvider: Bronorganisatie
sourceTitle: Titel van de bronpagina/dataset
sourceUrl: https://...
sourcePublicationDate: 2025-01-01
---

import { JouwDashboard } from "@/components/analyses/jouw-slug/JouwDashboard"

Korte introtekst (optioneel).

<JouwDashboard />
```

Belangrijk:
- Zet **geen** `# H1` in de MDX: de pagina-layout rendert de titel al.
- De footer “Bron: …” komt automatisch uit `sourceProvider/sourceUrl/sourceTitle/sourcePublicationDate`.

## 2) Consistente plaatsing van knoppen/filters in dashboards

Doel: overal dezelfde “look & feel” voor:
- rechtsboven: `CSV` + `Embed`
- onder de sectietitel: tabs/selector links, filters/extra controls rechts

Gebruik daarom (bij voorkeur) deze gedeelde componenten:

### A) Geo + grafiek/tabel/kaart (meest standaard)

Gebruik `AnalysisSection`:
- Bestand: `embuild-analyses/src/components/analyses/shared/AnalysisSection.tsx`
- UI: tabs `Grafiek/Tabel/Kaart` + geo-filters + export

### B) Time series zonder geo (bv. jaar/kwartaal/type/trend)

Gebruik `TimeSeriesSection`:
- Bestand: `embuild-analyses/src/components/analyses/shared/TimeSeriesSection.tsx`
- UI: sectietitel + export, en daaronder tabs links + extra controls rechts (bv. metriek-selector)

## 3) Embed/CSV afspraken

- Geef altijd `slug` + `sectionId` door aan `AnalysisSection`/`TimeSeriesSection` zodat `ExportButtons` correcte embed-URL’s kan genereren.
- Als een sectie “Embed” moet ondersteunen, voeg ze toe aan `embuild-analyses/src/lib/embed-config.ts`.

