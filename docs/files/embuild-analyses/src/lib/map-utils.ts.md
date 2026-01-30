---
kind: file
path: embuild-analyses/src/lib/map-utils.ts
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

# map-utils.ts

**Bestand**: `embuild-analyses/src/lib/map-utils.ts`

## Overzicht

Utility functies voor het expanderen van geaggregeerde geografische data (provincie/regio niveau) naar gemeenteniveau voor gebruik met `MunicipalityMap`.

## Achtergrond

Sinds de consolidatie van de kaartcomponenten toont de applicatie alleen nog gemeentegrenzen op kaarten. Wanneer data op provincie- of regioniveau beschikbaar is, moet deze eerst worden "geëxpandeerd" naar gemeenteniveau voor visualisatie. Deze utilities zorgen voor die conversie.

## Functies

### `expandProvinceToMunicipalities<T>`

Expandeert provincie-niveau data naar gemeenteniveau. Elke gemeente krijgt de waarde van zijn bovenliggende provincie.

**Type signature:**
```typescript
export function expandProvinceToMunicipalities<T>(
  provinceData: T[],
  getProvinceCode: (item: T) => string,
  getValue: (item: T) => number | null
): MunicipalityData[]
```

**Parameters:**
- `provinceData`: Array van data-objecten op provincieniveau
- `getProvinceCode`: Functie die de provinciecode uit een data-item haalt
- `getValue`: Functie die de numerieke waarde uit een data-item haalt

**Returns:**
```typescript
type MunicipalityData = {
  municipalityCode: string  // NIS gemeentecode
  value: number | null      // Waarde van bovenliggende provincie
}
```

**Voorbeeld:**
```typescript
// Input: provincie-niveau data
const provinceData = [
  { p: '10000', permits: 500 },  // Antwerpen
  { p: '20001', permits: 300 },  // Vlaams-Brabant
]

// Expandeer naar gemeenten
const municipalityData = expandProvinceToMunicipalities(
  provinceData,
  (d) => d.p,
  (d) => d.permits
)

// Output: elke gemeente krijgt de waarde van zijn provincie
// [
//   { municipalityCode: '11001', value: 500 },  // Aartselaar (in Antwerpen)
//   { municipalityCode: '11002', value: 500 },  // Antwerpen (in Antwerpen)
//   { municipalityCode: '23002', value: 300 },  // Asse (in Vlaams-Brabant)
//   ...
// ]
```

### `expandRegionToMunicipalities<T>`

Expandeert regio-niveau data naar gemeenteniveau. Elke gemeente krijgt de waarde van zijn bovenliggende regio.

**Type signature:**
```typescript
export function expandRegionToMunicipalities<T>(
  regionData: T[],
  getRegionCode: (item: T) => string,
  getValue: (item: T) => number | null
): MunicipalityData[]
```

**Parameters:**
- `regionData`: Array van data-objecten op regioniveau
- `getRegionCode`: Functie die de regiocode uit een data-item haalt
- `getValue`: Functie die de numerieke waarde uit een data-item haalt

**Returns:** Zelfde `MunicipalityData[]` type als `expandProvinceToMunicipalities`

**Voorbeeld:**
```typescript
const regionData = [
  { r: '2000', bankruptcies: 1200 },  // Vlaanderen
  { r: '3000', bankruptcies: 800 },   // Wallonië
  { r: '4000', bankruptcies: 150 },   // Brussel
]

const municipalityData = expandRegionToMunicipalities(
  regionData,
  (d) => d.r,
  (d) => d.bankruptcies
)
```

### `loadMunicipalities`

Laadt de lijst van alle Belgische gemeenten.

**Type signature:**
```typescript
export async function loadMunicipalities(): Promise<
  Array<{ code: string; name: string }>
>
```

**Returns:** Array van objecten met gemeentecode en naam

## Gebruik in Dashboards

### Voorbeeld 1: Provincie data met tijdreeks

```typescript
import { MunicipalityMap } from "../shared/MunicipalityMap"
import { expandProvinceToMunicipalities } from "@/lib/map-utils"

// Data: provincie per jaar
const provinceYearData = [
  { p: '10000', year: 2020, value: 100 },
  { p: '10000', year: 2021, value: 120 },
  { p: '20001', year: 2020, value: 80 },
  { p: '20001', year: 2021, value: 90 },
]

// Expandeer naar gemeenten (behoud jaar-dimensie)
const municipalityData = provinceYearData.flatMap((d) => {
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

// Gebruik in kaart met tijdslider
<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  getPeriod={(d) => d.year}
  periods={[2020, 2021]}
  showTimeSlider={true}
  showProvinceBoundaries={true}
  height={500}
/>
```

### Voorbeeld 2: Regio data

```typescript
const regionData = [
  { r: '2000', metric: 45.2 },  // Vlaanderen
]

const municipalityData = expandRegionToMunicipalities(
  regionData,
  (d) => d.r,
  (d) => d.metric
)

<MunicipalityMap
  data={municipalityData}
  getGeoCode={(d) => d.municipalityCode}
  getValue={(d) => d.value}
  showProvinceBoundaries={true}
/>
```

### Voorbeeld 3: Mixed provincie/regio data

```typescript
const mapData = [
  { p: '10000', value: 100 },  // Provincie
  { r: '4000', value: 50 },    // Regio
]

const municipalityData = mapData.flatMap((d) => {
  if ('p' in d) {
    return expandProvinceToMunicipalities([d], (x) => x.p, (x) => x.value)
  } else {
    return expandRegionToMunicipalities([d], (x) => x.r, (x) => x.value)
  }
})
```

## Implementatie Details

### Mapping logica

De functies gebruiken `geo-utils.ts` voor het bepalen van provincie/regio per gemeente:

- `getProvinceForMunicipality(municipalityCode)`: Bepaalt provincie op basis van NIS-code prefix
- `getRegionForMunicipality(municipalityCode)`: Bepaalt regio via provincie

### Performance

- **Tijdscomplexiteit**: O(n × m) waar n = aantal provincies/regio's en m = aantal gemeenten (581)
- **Optimalisatie**: Gebruik `Map` voor snelle lookup van provincie/regio waarden
- **Best practice**: Expandeer data eenmalig in `useMemo` hook

```typescript
const municipalityData = useMemo(() => {
  return expandProvinceToMunicipalities(
    provinceData,
    (d) => d.provinceCode,
    (d) => d.value
  )
}, [provinceData])
```

## Gerelateerde Componenten

- [MunicipalityMap.tsx](../components/analyses/shared/MunicipalityMap.tsx.md) - Gebruikt de geëxpandeerde data
- [geo-utils.ts](geo-utils.ts.md) - Geografische utilities
- [AnalysisSection.tsx](../components/analyses/shared/AnalysisSection.tsx.md) - Gebruikt expansie voor kaarten

## Historische Context

Voor de kaartconsolidatie (januari 2025) hadden we aparte `RegionMap`, `ProvinceMap` en `MunicipalityMap` componenten. Deze konden elk hun eigen niveau renderen. Na de consolidatie tonen alle kaarten alleen gemeentegrenzen, waardoor deze expansion utilities nodig werden.

### Waarom deze aanpak?

1. **Visuele consistentie**: Alle kaarten tonen dezelfde gemeentegrenzen
2. **Gebruiksvriendelijkheid**: Geen verwarrende level-switching meer
3. **Data transparantie**: Duidelijk dat provincie/regio data uniform verdeeld is over gemeenten
4. **Performance**: Eenmalig laden van gemeente GeoJSON (790KB)
