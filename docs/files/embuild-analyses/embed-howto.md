---
kind: file
path: embuild-analyses/embed-howto.md
role: guide
last_reviewed: 2026-01-17
---

# Embed how‑to — Stappen om een sectie embeddable te maken ✅

Korte beschrijving

Deze gids beschrijft de stappen om een analysis-sectie (bv. grafiek, tabel of kaart) embeddable te maken via het iframe-embed systeem dat gebruikt wordt op de site.

Stappen (kort)

1. Voeg je sectie toe aan `EMBED_CONFIGS` in `src/lib/embed-config.ts`.
   - Geef een `slug` (analyse) en `sectionId` (unieke sectie binnen die analyse) op.
   - Stel `height` in (px) zodat iframes een redelijke default hoogte krijgen.

2. Zorg dat de sectie `ExportButtons` of `TimeSeriesSection` krijgt waarvoor `slug` en `sectionId` worden doorgegeven.
   - `ExportButtons` genereert de embed-iframe code automatisch als `slug` + `sectionId` aanwezig zijn.

3. Voeg je embed-data toe aan `src/lib/embed-data-registry.ts` wanneer je een standalone embed met gestripte dataset wil aanbieden.
   - Dit zorgt dat de embed route `/embed/<slug>/<section>/` data kan laden zonder de volledige analysepage.

4. Test lokaal met `./test-production.sh` (dit simuleert de productie basePath) en de Playwright E2E tests.
   - Er is ook een eenvoudige `embuild-analyses/tests/test.html` die de parent-side resizer script gebruikt voor handmatig testen.

Voorbeeld: embed-config toevoeging

```ts
// src/lib/embed-config.ts
export const EMBED_CONFIGS = [
  {
    slug: "mijn-analyse",
    sectionId: "mijn-sectie",
    height: 520,
    // extra config velden...
  }
]
```

Voorbeeld: gebruik in component

```tsx
// binnen TimeSeriesSection / AnalysisSection
<TimeSeriesSection
  title="Voorbeeld"
  slug="mijn-analyse"
  sectionId="mijn-sectie"
  defaultView="chart"
  views={[{ value: 'chart', label: 'Grafiek', content: <MyChart />, exportData: chartExportData, exportMeta: { viewType: 'chart' } } ]}
/>
```

Embed-iframe voorbeeld (gegenereerd door `ExportButtons`)

```html
<iframe
  src="https://<your-site>/embed/mijn-analyse/mijn-sectie/?view=chart"
  data-data-blog-embed="true"
  width="100%"
  height="520"
  style="border:0;"
  title="Voorbeeld"
  loading="lazy"
></iframe>
```

Testen & Troubleshooting ✅

- Run `./test-production.sh` om productie build met basePath te testen.
- Playwright e2e-tests (zie `embuild-analyses/tests/e2e/`) bevatten embed-tests (iframe, resizing, filters).
- Als embed niet werkt: controleer `EMBED_CONFIGS`, geldige slug/section, en eventuele foutmeldingen in console.

Checklist / common pitfalls ⚠️

- Vergeet niet `slug` en `sectionId` door te geven aan `TimeSeriesSection`/`AnalysisSection` als je export/embed wil.
- Voeg embed data aan `embed-data-registry.ts` als je standalone embed nodig hebt.
- Stel `height` in `embed-config` zodat iframes niet te klein zijn.
- Gebruik `test-production.sh` om basePath issues (GitHub Pages) vroeg te ontdekken.

Referentie voorbeelden

- Zie `gemeentelijke-investeringen` voor uitgebreide, embeddable secties (bv. BV- en REK-secties). Deze analyse is een goed voorbeeld van chunked data + embeds.
- Zie `embuild-analyses/tests/test.html` voor de parent-side resizer script.
