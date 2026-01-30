---
kind: file
path: embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx
role: Unknown
workflows: []
inputs: []
outputs: []
interfaces: []
stability: experimental
owner: Unknown
safe_to_delete_when: Unknown
superseded_by: null
last_reviewed: 2026-01-17
---

# MunicipalityMap.tsx

**Bestand**: `embuild-analyses/src/components/analyses/shared/MunicipalityMap.tsx`

## Overzicht

**Geconsolideerde kaartcomponent** die alle geografische visualisaties afhandelt via municipality-only rendering. Vervangt de voormalige `RegionMap`, `ProvinceMap`, `UnifiedMap` en `InteractiveMap` componenten.

## Kernprincipe

Alle kaarten tonen **alleen gemeentegrenzen** (581 Belgische gemeenten). Data op provincie- of regioniveau wordt eerst geëxpandeerd naar gemeenteniveau via `map-utils.ts`. Provinciegrenzen kunnen optioneel als overlay worden getoond.

## Features

- 🗺️ Municipality-only rendering (één geografische laag)
- 🔲 Optionele provincie boundaries als overlay
- 🎯 Auto-zoom naar geselecteerde gemeente
- ⏱️ Tijdreeks ondersteuning met TimeSlider
- 🔍 Zoom/pan controls
- 🎨 Kleurenschema's voor choropleth weergave
- 📊 Tooltip met data details
- 🖱️ Click-to-select interactiviteit

## Props API

```typescript
interface MunicipalityMapProps<TData extends UnknownRecord = UnknownRecord> {
  // Data (altijd op gemeenteniveau na expansie)
  data: TData[]
  getGeoCode?: (d: TData) => string | number | null | undefined
  getValue?: (d: TData) => number | null | undefined

  // Tijdreeks (optioneel)
  getPeriod?: (d: TData) => number | string
  periods?: (number | string)[]
  showTimeSlider?: boolean

  // Interactiviteit
  selectedMunicipality?: string | null
  onSelectMunicipality?: (code: string | null) => void

  // Visualisatie
  formatValue?: (value: number) => string
  tooltipLabel?: string
  colorScheme?: ColorScheme
  showProvinceBoundaries?: boolean  // Toon provincie overlay

  // Layout
  height?: number
  className?: string
}
```

### Type Definitions

```typescript
type UnknownRecord = Record<string, any>

type ColorScheme = "blue" | "green" | "orange" | "red" | "purple"
```

## Gebruik

### Basis gebruik (gemeentedata)

```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.permits}
  formatValue={(v) => `${v} vergunningen`}
  tooltipLabel="Bouwvergunningen"
  height={500}
/>
```

### Met provincie data (via expansie)

```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

// Provincie-niveau data
const provinceData = [
  { p: '10000', count: 500 },  // Antwerpen
  { p: '20001', count: 300 },  // Vlaams-Brabant
]

// Expandeer naar gemeenten
const municipalityData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.p,
  (d) => d.count
)

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}  // Toon provincie overlay
  height={500}
/>
```

### Met tijdreeks

```typescript
// Data met jaarlijkse waarden per provincie
const yearlyProvinceData = [
  { p: '10000', year: 2020, value: 100 },
  { p: '10000', year: 2021, value: 120 },
  { p: '20001', year: 2020, value: 80 },
  { p: '20001', year: 2021, value: 90 },
]

// Expandeer naar gemeenten (behoud jaar-dimensie)
const municipalityData = yearlyProvinceData.flatMap((d) => {
  const expanded = expandProvinceToMunicipalities(
    [d],
    (item) => item.p,
    (item) => item.value
  )
  return expanded.map((m) => ({
    ...m,
    year: d.year,
  }))
})

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  getPeriod={(d) => d.year}
  periods={[2020, 2021, 2022, 2023]}
  showTimeSlider={true}
  showProvinceBoundaries={true}
  colorScheme="green"
  height={500}
/>
```

### Met selectie

```typescript
const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null)

<MunicipalityMap
  data={data}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  selectedMunicipality={selectedMunicipality}
  onSelectMunicipality={setSelectedMunicipality}
/>
```

## Kleurenschema's

```typescript
const COLOR_SCHEMES = {
  blue: ["#deebf7", "#9ecae1", "#3182bd", "#08519c"],
  green: ["#e5f5e0", "#a1d99b", "#31a354", "#006d2c"],
  orange: ["#fee6ce", "#fdae6b", "#e6550d", "#a63603"],
  red: ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"],
  purple: ["#efedf5", "#bcbddc", "#756bb1", "#54278f"],
}
```

Default: `blue`

## Rendering Logica

### GeoJSON Layers

```
┌─────────────────────────────────────┐
│                                     │
│  Layer 3: Province Boundaries       │ ← Optioneel (stroke only)
│  (showProvinceBoundaries={true})    │
│                                     │
│  Layer 2: Municipality Fill         │ ← Hoofdlaag (choropleth)
│  (colored by data value)            │
│                                     │
│  Layer 1: Base Map                  │
│  (Belgium outline)                  │
│                                     │
└─────────────────────────────────────┘
```

### Auto-Zoom

Wanneer een gemeente geselecteerd wordt:
1. Zoek GeoJSON feature op basis van NIS-code
2. Bereken bounding box met `geoBounds()`
3. Zoom naar bbox met padding
4. Centreer kaart

```typescript
if (selectedMunicipality) {
  const feature = geographies.find(
    geo => geo.properties.code === selectedMunicipality
  )
  if (feature) {
    const bounds = geoBounds(feature)
    setZoom(calculateZoomLevel(bounds))
    setCenter(calculateCenter(bounds))
  }
}
```

## Provincie Overlay

Wanneer `showProvinceBoundaries={true}`:

```typescript
<Geographies geography={provincesGeoJSON}>
  {({ geographies }) =>
    geographies.map((geo) => (
      <Geography
        key={geo.properties.code}
        geography={geo}
        fill="none"                    // Transparante vulling
        stroke="#000"                   // Zwarte rand
        strokeWidth={2}                 // Dikke lijn
        style={{ pointerEvents: 'none' }} // Click-through naar gemeenten
      />
    ))
  }
</Geographies>
```

## Tooltip

### Default Tooltip

```
┌─────────────────────┐
│ Antwerpen           │ ← Gemeentenaam
│ Vergunningen: 1.234 │ ← Label + waarde
└─────────────────────┘
```

### Custom Format

```typescript
<MunicipalityMap
  formatValue={(v) => new Intl.NumberFormat('nl-BE').format(v)}
  tooltipLabel="Aantal aanvragen"
/>
```

## Time Slider

Geïntegreerd met `TimeSlider` component:

```
┌───────────────────────────────────────┐
│  Kaart                                │
│                                       │
│  [   Gemeenten met data   ]           │
│                                       │
└───────────────────────────────────────┘
  ├─────●─────┼─────┼─────┼─────┤
  2020  2021  2022  2023  2024
```

## Performance

### GeoJSON Loading

```typescript
// Geladen via react-simple-maps
const municipalities = "/maps/belgium_municipalities.json"  // 790KB
const provinces = "/maps/belgium_provinces.json"            // 150KB (optioneel)
```

- **Initiële load**: ~1 second (790KB parse)
- **Caching**: Browser cached na eerste load
- **Rendering**: ~100ms voor 581 gemeenten

### Optimalisaties

```typescript
// Memoize data aggregatie
const dataMap = useMemo(() => {
  return new Map(
    data.map(d => [getGeoCode(d), getValue(d)])
  )
}, [data, getGeoCode, getValue])

// Memoize kleurberekening
const getColor = useCallback((value: number | null) => {
  if (value === null) return "#ccc"
  // ... kleur logica
}, [colorScheme, dataMap])
```

## Accessibility

- ✅ Keyboard navigatie: Tab door kaart features
- ✅ ARIA labels voor regio's
- ✅ Screen reader tekst voor tooltips
- ⚠️ Kleurenblindheid: Gebruik altijd tooltip labels (niet alleen kleur)

## Browser Support

- ✅ Chrome, Firefox, Safari, Edge (modern browsers)
- ✅ Mobile responsive (touch gestures voor zoom/pan)
- ⚠️ Vereist SVG ondersteuning

## Gerelateerde Componenten

- [map-utils.ts](../../../lib/map-utils.ts.md) - Data expansie utilities
- [TimeSlider.tsx](TimeSlider.tsx.md) - Tijdreeks slider
- [MapControls.tsx](MapControls.tsx.md) - Zoom controls
- [MapLegend.tsx](MapLegend.tsx.md) - Kleurenlegenda
- [MunicipalitySearch.tsx](MunicipalitySearch.tsx.md) - Gemeente zoeken

## Migratie van Oude Componenten

Deze component vervangt:

- ❌ `RegionMap.tsx` (deleted)
- ❌ `ProvinceMap.tsx` (deleted)
- ❌ `UnifiedMap.tsx` (deleted)
- ❌ `InteractiveMap.tsx` (gerefactored → MunicipalityMap)

### Voor en Na

**Voor (RegionMap):**
```typescript
<RegionMap
  data={regionData}
  metric="permits"
  getGeoCode={(d) => d.regionCode}
  getMetricValue={(d) => d.count}
/>
```

**Na (MunicipalityMap):**
```typescript
const municipalityData = expandRegionToMunicipalities(
  regionData,
  (d) => d.regionCode,
  (d) => d.count
)

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}
/>
```

## Voordelen Nieuwe Aanpak

1. **Eén component**: Alle kaarten gebruiken dezelfde code
2. **Consistente UX**: Geen verwarrende level-switching
3. **Geografische nauwkeurigheid**: Altijd echte gemeentegrenzen
4. **Betere performance**: GeoJSON eenmalig laden
5. **Makkelijker onderhoud**: Geen code duplicatie

## Bekende Issues

- [ ] Auto-zoom werkt niet goed voor zeer kleine gemeenten (Brussels)
- [ ] Provincie overlay verbergt soms gemeente tooltips
- [ ] Time slider kan traag zijn met veel data (>10k datapunten)

## Changelog

### Januari 2025 - Kaartconsolidatie
- ✅ Gerefactored van `InteractiveMap.tsx`
- ✅ Municipality-only rendering
- ✅ Provincie boundary overlay toegevoegd
- ✅ Verwijderd: multi-level GeoJSON loading
- ✅ Vereenvoudigde props API
