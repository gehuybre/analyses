---
kind: file
path: src/components/analyses/shared/MunicipalityMap.tsx
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

# MunicipalityMap — Input & Geo-tips 🗺️

Korte beschrijving

`MunicipalityMap` (en de wrapper `MapSection`) is bedoeld voor gemeente-niveau choropleth kaarten. Het gebruikt gemeente NIS-codes (5-cijferig) en een gemeentelijke GeoJSON (public/maps/belgium_municipalities.json).

Belangrijkste punten

- Data moet op gemeenteniveau zijn (5-digit NIS code). Verwachte accessor is `m` of `municipalityCode` tenzij `getGeoCode` is gespecificeerd.
- Voor tijdseries: geef `getPeriod`/`periods` en `showTimeSlider=true` door.
- Wil je provincedata tonen? breek die eerst uit naar gemeenten met `expandProvinceToMunicipalities` in `src/lib/map-utils.ts`.

Copy-paste voorbeeld

```tsx
import { MapSection } from "@/components/analyses/shared/MapSection"

const municipalityData = [
  { m: '11001', value: 100, y: 2024 }, // Aartselaar
  { m: '12001', value: 200, y: 2024 }, // Antwerpen
]

<MapSection
  data={municipalityData}
  getGeoCode={(d) => d.m}
  getValue={(d) => d.value}
  getPeriod={(d) => d.y}
  periods={[2020, 2021, 2022, 2023, 2024]}
  showTimeSlider={true}
  showProvinceBoundaries={true}
  height={500}
/>
```

Veelvoorkomende fouten & checklist ⚠️

- Data bevat geen 5-cijferige NIS-codes: kaart kan niets matchen.
- Je geeft provincie/regionale data zonder expanderen: gebruik `expandProvinceToMunicipalities`.
- Mis-match tussen `getPeriod` en `periods`: zorg dat je `periods` consistent sorted aanlevert.
- GeoJSON ontbreekt of is niet bereikbaar: de component laadt `public/maps/belgium_municipalities.json` via `getBasePath()`.

Flanders-only datasets & fusies (belangrijk) ✅

- De `MunicipalityMap` detecteert automatisch wanneer alle datarijen alleen Vlaamse gemeenten bevatten. In dat geval wordt alleen Vlaanderen weergegeven en **zullen gemeenten uit Brussel/Wallonië visueel verborgen** (d.w.z. transparant / geen stroke). Dit voorkomt dat lege of irrelevante gemeentegrenzen de kaart rommelig maken.
- **Let op fusies**: voor datasets die vóór gemeentefusies zijn samengesteld (bv. historische tabellen met oude NIS-codes) moet je de codes normaliseren of aggregeren naar de huidige (post-fusie) NIS-codes zodat de juiste waarde op de kaart terechtkomt.

- **Tooltip kleuren & gedrag bij fusies**: bij hover toont de tooltip nu **stijging = groen** (▲) en **daling = rood** (▼). Fusiegemeenten die geen data hebben (bijvoorbeeld omdat oude NIS-codes niet zijn genormaliseerd/gebundeld) verschijnen als **Geen data** en krijgen een lichtgrijze vulling op de kaart.

Praktische opties (aanpak afhankelijk van jouw data) 🧭

1) Post-fusie / aanbevolen (gebruik standaard GeoJSON)

- Wanneer mogelijk: **aggregeer je data naar de huidige (post-fusie) NIS-codes** en gebruik de standaard `public/maps/belgium_municipalities.json`. Dit is de eenvoudigste aanpak en garandeert dat geometrieën en data altijd matchen.

```ts
import { aggregateByNormalizedNis } from "@/lib/nis-fusion-utils"

const aggregated = aggregateByNormalizedNis(rawData, (d) => d.m, (d) => d.value, "sum")
const municipalityData = Array.from(aggregated.entries()).map(([m, value]) => ({ m, value }))

// Nu doorgeven aan MapSection / MunicipalityMap
<MapSection data={municipalityData} getGeoCode={(d) => d.m} getValue={(d) => d.value} />
```

2) Pre-fusie / historische view (preserveer oude grenzen)

- Als je expliciet een **historische weergave** wilt met oude gemeentegrenzen en namen, gebruik dan een **historische GeoJSON** waarin elke (pre-fusie) gemeente een eigen geometrie en naam heeft. Zorg dat je datarijen en GeoJSON codes overeenkomen.
- Omdat `MunicipalityMap` standaard de actuele (post-fusie) GeoJSON laadt, heb je twee opties:
  - Gebruik een aangepaste wrapper of pas `MunicipalityMap` aan zodat je een alternatieve GeoJSON (bv. `public/maps/belgium_municipalities_2000.json`) kunt doorgeven.
  - Of vervang tijdelijk de GeoJSON in `public/maps` tijdens je build als het historisch project-specifiek is.

Kort voorbeeld voor een wrapper die een custom GeoJSON laadt:

```tsx
// components/MapWithCustomGeo.tsx
import historicalGeo from "/maps/belgium_municipalities_2000.json"
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"

export function MapWithCustomGeo(props) {
  // Voor historische geometrieën kun je het GeoJSON-object direct doorgeven via
  // de nieuwe prop `municipalitiesGeoOverride`.
  return (
    <MunicipalityMap
      {...props}
      municipalitiesGeoOverride={historicalGeo}
    />
  )
}
```

Of importeer het historische GeoJSON direct in je analyse of pagina en geef het door als prop:

```tsx
// In TypeScript kun je het GeoJSON importeren en als `any` casten om type-errors te voorkomen:
// import historicalGeo from "/maps/belgium_municipalities_2000.json" as any

<MunicipalityMap
  data={data}
  getGeoCode={(d) => d.m}
  getValue={(d) => d.value}
  municipalitiesGeoOverride={historicalGeo as any}
/>
```

Tip: als je liever een kleine wrapper gebruikt, kun je `MapWithCustomGeo` gebruiken en het GeoJSON als prop doorgeven.

Dit zorgt ervoor dat je oude (pre-fusie) gemeenten ieder hun eigen geometrie en naam behouden, terwijl gefuseerde datasets nog steeds de juiste (gebundelde) waarde kunnen tonen wanneer je die aggregeert naar de post-fusie codes.
3) Algemeen principe (altijd één waarheid)

- **Zorg dat data en geometrie dezelfde 'eenheid' hebben**:
  - Heb je pre-fusie data en pre-fusie geometrieën → geef iedere gemeente in de GeoJSON een eigen naam en waarde.
  - Heb je gefuseerde data → zorg dat de geometrie (of de genormaliseerde code) de bundel vertegenwoordigt en bevat de samengevoegde waarde.

- Wanneer je data niet overeenkomt met de standaard geometrie, voorkom lege (geen data) fusiegemeenten door ofwel te aggregeren naar post-fusie NIS of door de juiste historische GeoJSON te gebruiken.

- Heb je behoefte aan hulp om `MunicipalityMap` te laten accepteren van een custom GeoJSON (handiger voor historische weergaven)? Zeg het, dan kan ik die kleine componentwijziging implementeren en voorbeeldcode toevoegen.

Aanbevolen aanpak (copy-paste ready)

```ts
// Normaliseer en aggregeer oude NIS-codes naar de huidige codes
import { aggregateByNormalizedNis } from "@/lib/nis-fusion-utils"

const aggregated = aggregateByNormalizedNis(
  rawData,                 // je ruwe rijen
  (d) => d.m,              // nis-code accessor
  (d) => d.value,          // value accessor
  'sum'                    // aggregator (sum is meestal gewenst)
)

const municipalityData = Array.from(aggregated.entries()).map(([m, value]) => ({ m, value }))

// Nu doorgeven aan MapSection / MunicipalityMap
<MapSection data={municipalityData} getGeoCode={(d) => d.m} getValue={(d) => d.value} />
```

- `aggregateByNormalizedNis` en `normalizeNisCode` zitten in `src/lib/nis-fusion-utils.ts` en worden gebruikt door de `gemeentelijke-investeringen` analyse om fusies correct te behandelen.
- Als je juist een historische (pre-fusie) visualisatie wil maken waarin oude grenzen expliciet zichtbaar blijven, moet je expliciet oude codes gebruiken en de kaart niet normaliseren — maar hiervoor moet je GeoJSON/labels eventueel ook historisch aanpassen.

Praktisch voorbeeld: vergunningen-goedkeuringen

- In `VergunningenDashboard.tsx` hebben we recent de invoerdata vooraf genormaliseerd en per periode geaggregeerd:

```ts
// Normalize NIS codes and aggregate per period so multiple old codes add up
const normStr = normalizeNisCode(row.m) || String(row.m).padStart(5, "0")
const normNum = Number(normStr)
// group by `${y}-${q}|${normStr}` and sum counts
```

- Deze stap zorgt dat:
  - Fusiegemeenten correct worden gezet op de huidige NIS (post-fusie)
  - Wanneer dataset enkel Vlaamse gemeenten bevat, de kaart automatisch Flanders-focused weergave gebruikt (geen niet-Vlaamse grenzen)

Referentie voorbeelden

- `gemeentelijke-investeringen` gebruikt map-secties uitgebreid (bv. `InvesteringenBVSection` en `InvesteringenREKSection`) en is een goed voorbeeld van chunked municipality-data met time slider. Zie hun handling van fusies en `getConstituents`/`normalizeNisCode` in `src/lib/nis-fusion-utils.ts`.
- Zie `MapSection.tsx` in `src/components/analyses/shared/` voor een voorbeeld met `MunicipalitySearch` en auto-zoom.
