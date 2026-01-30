---
kind: file
path: src/components/analyses/shared/FilterableTable.tsx
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

# FilterableTable — Gebruik en voorbeeld ✅

Korte beschrijving

FilterableTable is een eenvoudige, herbruikbare tabelcomponent voor tijdreeks-achtige data (jaartal/kwartaal of periode-cellen). De component verwacht een array met rijen waarin de zichtbare periode óf als afzonderlijke velden (`y`, `q`) aanwezig is, óf als `periodCells` (array van strings/nummers) voor meerdere periode-kolommen.

Kort voorbeeld (copy-paste ready)

```tsx
import { FilterableTable } from "@/components/analyses/shared/FilterableTable"

const sampleData = [
  // optie 1: periode in aparte velden y/q
  { y: 2024, q: 1, value: 1234, sortValue: 20241 },
  { y: 2024, q: 2, value: 2345, sortValue: 20242 },

  // optie 2: periodCells (multi-kolom)
  { periodCells: ["2014-2019", "Totaal"], value: 1000 },
]

export default function Example() {
  return <FilterableTable data={sampleData} label="Aantal" periodHeaders={["Periode", "Categorie"]} />
}
```

Data shape & advies

- Verwachte velden:
  - `y` (number) en `q` (number) of
  - `periodCells` (Array<string | number>)
  - `value` (number) of `formattedValue` (string) voor weergave
  - optioneel `sortValue` (number) voor expliciete sortering
- `label` geeft de kolomtitel voor het rechter (value) column
- `periodHeaders` kan gebruikt worden om header labels te overschrijven

Checklist / common pitfalls ⚠️

- Zorg dat NIS-codes of periodes altijd consistent zijn met de brondata.
- Als je wilt dat de tabel op een specifiek veld sorteert, zorg dat `sortValue` aanwezig is (number).
- Gebruik `formattedValue` als je specifieke formattering (bv. € of scheiding) wilt tonen; anders wordt `value` gebruikt.
- Verwacht geen paging: component gebruikt een scrollable container (max-height 400px).

Voorbeeldreferentie

- Bekijk hoe `gemeentelijke-investeringen` secties tabellen tonen (zie `embuild-analyses/analyses/gemeentelijke-investeringen`), dit is een goed voorbeeld van data-transform en gebruik van `FilterableTable`.

Meer info

- Gebruik `FilterableTable` wanneer je een compacte, scrollbare tabel met periodes wilt tonen. Voor complexe tabellen met veel kolommen overweeg een dedicated component.
