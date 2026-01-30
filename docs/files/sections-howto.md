---
kind: file
path: docs/files/sections-howto.md
role: guide
workflows: []
inputs: []
outputs: []
interfaces: []
stability: stable
owner: Unknown
safe_to_delete_when: null
superseded_by: null
last_reviewed: 2026-01-17
---

# Sections how‑to — AnalysisSection vs TimeSeriesSection ⚙️

Korte beschrijving

Deze gids helpt je kiezen tussen `AnalysisSection` en `TimeSeriesSection` en toont voorbeeldgebruik. Beide components helpen boilerplate (tabs, export, geo filters) vermijden, maar hebben verschillende focuspunten.

Wanneer wat gebruiken?

- AnalysisSection
  - Gebruik wanneer je één dataset hebt met chart/table/(optioneel)map tabs die allemaal hetzelfde aggregatielogica delen.
  - Handig voor periodieke aggregaties (y/q) en automatische aggregatie per periode.
- TimeSeriesSection
  - Gebruik wanneer je meerdere 'views' hebt (bijv. verschillende datakukjes) en elk view zijn eigen content/metadata/export definieert.
  - Biedt flexibiliteit: elke view kan eigen `exportData` en `exportMeta` bevatten.

Kort copy-paste voorbeelden

AnalysisSection voorbeeld

```tsx
import { AnalysisSection } from "@/components/analyses/shared/AnalysisSection"

<AnalysisSection
  title="Vergunningen aanvragen"
  data={dataRows}
  municipalities={municipalities}
  metric="aantal"
  label="Aanvragen"
  slug="vergunningen-aanvragen"
  sectionId="aanvragen"
  showMap={true}
/>
```

TimeSeriesSection voorbeeld

```tsx
import { TimeSeriesSection } from "@/components/analyses/shared/TimeSeriesSection"

const views = [
  {
    value: "chart",
    label: "Grafiek",
    content: <FilterableChart data={chartData} />, 
    exportData: chartExportData,
    exportMeta: { viewType: 'chart', periodHeaders: ['Jaar'], valueLabel: 'Aantal' }
  },
  {
    value: "table",
    label: "Tabel",
    content: <FilterableTable data={tableData} />,
    exportData: tableExportData,
    exportMeta: { viewType: 'table', periodHeaders: ['Jaar'], valueLabel: 'Aantal' }
  }
]

<TimeSeriesSection
  title="Evolutie aanvragen"
  slug="vergunningen-aanvragen"
  sectionId="evolutie"
  defaultView="chart"
  views={views}
/>
```

ExportData shape & tips

- `exportData` is een array met objects: `{ label: string, value: number, periodCells?: string[] }`.
- `exportMeta` (optioneel) mag de volgende velden bevatten:
  - `viewType` (`chart|table|map`)
  - `periodHeaders` (string[])
  - `valueLabel` (string)
  - `embedParams` (Record<string,string|number|null|undefined>)

Checklist / common pitfalls ⚠️

- Altijd `slug` en `sectionId` doorgeven wanneer je export/embed verwacht (anders werken `ExportButtons` niet).
- Zorg dat `exportData` consistent is met wat `ExportButtons` verwacht (zie shape boven).
- Gebruik `AnalysisSection` voor data-aggregatie per periode; gebruik `TimeSeriesSection` als je meerdere, heterogene views hebt.

Referenties

- `gemeentelijke-investeringen` is een goede praktische referentie: zie hoe BV-/REK-secties chunked data laden en `ExportButtons`/embed ondersteunen.
- Bekijk ook `TimeSeriesSection.tsx` en `AnalysisSection.tsx` voor code-level details.
