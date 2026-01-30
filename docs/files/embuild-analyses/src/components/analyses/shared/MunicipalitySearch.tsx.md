---
kind: file
path: embuild-analyses/src/components/analyses/shared/MunicipalitySearch.tsx
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

# MunicipalitySearch.tsx

**Bestand**: `embuild-analyses/src/components/analyses/shared/MunicipalitySearch.tsx`

## Overzicht

Zoekcomponent met autocomplete voor het snel vinden en selecteren van Belgische gemeenten. Toont een dropdown met matchende gemeenten terwijl de gebruiker typt.

## Features

- 🔍 Real-time autocomplete tijdens typen
- ⌨️ Keyboard navigatie (pijltjes, Enter, Escape)
- 📋 Toont gemeentenaam + NIS-code
- 🔢 Maximum 10 resultaten tegelijk
- ❌ Clear button om selectie te resetten
- 🎯 Case-insensitive partial matching

## Props

```typescript
interface MunicipalitySearchProps {
  selectedMunicipality?: string | null    // NIS-code van geselecteerde gemeente
  onSelect: (code: string | null) => void // Callback bij selectie
  placeholder?: string                     // Custom placeholder text
  className?: string                       // Extra CSS classes
}
```

## Gebruik

### Basis gebruik

```typescript
import { MunicipalitySearch } from "@/components/analyses/shared/MunicipalitySearch"

function MyDashboard() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <MunicipalitySearch
      selectedMunicipality={selected}
      onSelect={setSelected}
      placeholder="Zoek een gemeente..."
    />
  )
}
```

### Integratie met GeoContext

```typescript
import { useGeo } from "@/components/analyses/shared/GeoContext"
import { MunicipalitySearch } from "@/components/analyses/shared/MunicipalitySearch"

function MyDashboard() {
  const { selectedMunicipality, setSelectedMunicipality } = useGeo()

  return (
    <MunicipalitySearch
      selectedMunicipality={selectedMunicipality}
      onSelect={setSelectedMunicipality}
    />
  )
}
```

### Integratie met MunicipalityMap

```typescript
import { MunicipalityMap } from "@/components/analyses/shared/MunicipalityMap"
import { MunicipalitySearch } from "@/components/analyses/shared/MunicipalitySearch"

function MyDashboard() {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null)

  return (
    <div>
      <MunicipalitySearch
        selectedMunicipality={selectedMunicipality}
        onSelect={setSelectedMunicipality}
      />

      <MunicipalityMap
        data={data}
        getGeoCode={(d) => d.municipalityCode}
        getValue={(d) => d.value}
        selectedMunicipality={selectedMunicipality}
        onSelectMunicipality={setSelectedMunicipality}
      />
    </div>
  )
}
```

## UI Gedrag

### Search Flow

1. **Lege staat**: Input leeg, placeholder zichtbaar
2. **Typen**: Dropdown verschijnt met max 10 matchende gemeenten
3. **Navigatie**: Gebruik ↑↓ pijltjes om te navigeren
4. **Selectie**: Klik of druk Enter om te selecteren
5. **Geselecteerd**: Gemeentenaam in input, clear button verschijnt
6. **Clear**: Reset selectie, input wordt leeg

### Keyboard Shortcuts

| Toets | Actie |
|-------|-------|
| `↑` | Vorige gemeente in lijst |
| `↓` | Volgende gemeente in lijst |
| `Enter` | Selecteer gehighlighte gemeente |
| `Escape` | Sluit dropdown |

### Matching Logica

```typescript
// Case-insensitive partial match op gemeentenaam
"gent" → match: "Gent"
"sint" → match: "Sint-Niklaas", "Sint-Truiden", "Sint-Pieters-Leeuw", ...
"brussel" → match: "Brussel", "Sint-Pieters-Woluwe", ...
```

## UI Components

Gebruikt shadcn/ui componenten:

```typescript
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
```

## Implementatie Details

### State Management

```typescript
const [searchQuery, setSearchQuery] = useState("")
const [open, setOpen] = useState(false)
const [highlightedIndex, setHighlightedIndex] = useState(0)
```

### Data Loading

```typescript
const municipalities = useMemo(async () => {
  return await loadMunicipalities()  // uit map-utils.ts
}, [])
```

### Filtering

```typescript
const filteredMunicipalities = useMemo(() => {
  if (!searchQuery) return []

  return municipalities
    .filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 10)  // Max 10 resultaten
}, [searchQuery, municipalities])
```

## Styling

### Default Layout

```
┌─────────────────────────────────────┐
│ Zoek gemeente...               [X]  │ ← Input + Clear button
└─────────────────────────────────────┘
  ▼ Dropdown (bij zoeken)
┌─────────────────────────────────────┐
│ Antwerpen (11002)                   │ ← Highlighted
│ Aartselaar (11001)                  │
│ Antwerpen (11025)                   │
│ ...                                 │
└─────────────────────────────────────┘
```

### Custom Styling

```typescript
<MunicipalitySearch
  className="w-full max-w-md"
  placeholder="Vind uw gemeente"
/>
```

## Toegankelijkheid

- ✅ Keyboard navigatie volledig ondersteund
- ✅ ARIA labels voor screenreaders
- ✅ Focus management bij dropdown open/sluiten
- ✅ Clear button heeft aria-label

## Performance

- **Lazy loading**: Gemeentelijst wordt eenmalig geladen
- **Debouncing**: Niet geïmplementeerd (581 gemeenten is beheersbaar)
- **Memoization**: Gefilterde lijst wordt gecached via `useMemo`

## Gerelateerde Componenten

- [MunicipalityMap.tsx](MunicipalityMap.tsx.md) - Kaart die zoekresultaat toont
- [GeoContext.tsx](GeoContext.tsx.md) - Globale gemeente selectie state
- [map-utils.ts](../../../lib/map-utils.ts.md) - `loadMunicipalities()` functie

## Voorbeelden in Productie

### Vergunningen Dashboard

```typescript
<div className="flex gap-4 items-end">
  <GeoFilter />  {/* Regio/provincie dropdown */}
  <MunicipalitySearch />  {/* Gemeente zoeken */}
</div>
```

### Standalone Map Pagina

```typescript
<div className="space-y-4">
  <MunicipalitySearch placeholder="Zoom naar gemeente..." />

  <MunicipalityMap
    data={data}
    getGeoCode={(d) => d.code}
    getValue={(d) => d.value}
    selectedMunicipality={selectedMunicipality}
    height={600}
  />
</div>
```

## Toekomstige Verbeteringen

Mogelijke uitbreidingen (nog niet geïmplementeerd):

- [ ] Provincienaam tonen in dropdown: "Antwerpen (Prov. Antwerpen)"
- [ ] Recente zoekopdrachten onthouden (local storage)
- [ ] Fuzzy matching voor typfouten: "antwrpen" → "Antwerpen"
- [ ] Postcode zoeken: "2000" → "Antwerpen"
- [ ] Auto-complete op Enter zonder selectie (eerste resultaat)
