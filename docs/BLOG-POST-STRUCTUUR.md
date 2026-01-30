# Blog Post Structuur

Deze handleiding beschrijft hoe een nieuwe analyse of blogbericht moet worden opgezet in het project.

## 1. Structuur van `content.mdx`

Nieuwe analyses worden geplaatst in `embuild-analyses/analyses/<slug>/content.mdx`. Elk bestand moet de volgende frontmatter bevatten:

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

<JouwDashboard />
```

### Belangrijke afspraken:
- Gebruik **geen** H1 (`#`) in de MDX; de titel wordt automatisch gerenderd vanuit de frontmatter.
- De footer met bronvermelding wordt automatisch gegenereerd.

## 2. Dashboards en UI Componenten

Voor een consistente gebruikerservaring gebruiken we gedeelde componenten:

- **AnalysisSection**: Voor analyses met geografische data (kaarten, grafieken en tabellen).
- **TimeSeriesSection**: Voor analyses die focussen op trends over tijd zonder geografische context.

## 3. Exports en Embeds

- Zorg dat elke sectie een unieke `sectionId` heeft.
- Voeg nieuwe embedbare secties toe aan `embuild-analyses/src/lib/embed-config.ts`.
- De `ExportButtons` component zorgt automatisch voor de juiste CSV-download en embed-codes.

Zie ook de `ANALYSIS_TEMPLATE.md` in de root van de `embuild-analyses` map voor een technisch voorbeeld.

## 4. Taal

Gebruik hoofdletters volgens de Nederlandse spelling. Zet alleen een hoofdletter aan het begin van een zin of lijn en bij eigennamen. Schrijf titels en tussenkoppen in zinshoofdletters, niet in title case. Zelfstandige naamwoorden krijgen geen hoofdletter tenzij het een eigennaam is.
