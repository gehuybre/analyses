"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getDataPath } from "@/lib/path-utils"
import { GeoProvider } from "../shared/GeoContext"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { ExportButtons } from "../shared/ExportButtons"
import { MapSection } from "../shared/MapSection"

// Data is now lazy-loaded from public/data/vastgoed-verkopen/
// Static imports replaced to prevent OOM errors during build

type YearlyRow = {
  y: number
  lvl: number
  nis: string
  type: string
  n: number
  p50: number
  name: string
}

type QuarterlyRow = {
  y: number
  q: number
  lvl: number
  nis: string
  type: string
  n: number
  p50: number
  p25: number
  p75: number
  name: string
}

type PropertyType = {
  code: string
  nl: string
}

type GeoEntity = {
  code: string
  name: string
}

type YearPoint = {
  sortValue: number
  periodCells: Array<string | number>
  value: number
}

type RegionPoint = {
  r: string
  y: number
  value: number
}

type ProvincePoint = {
  p: string
  y: number
  value: number
}

// Map region codes to geo-utils format
const REGION_CODE_MAP: Record<string, string> = {
  "02000": "2000",
  "03000": "3000",
  "04000": "4000",
}

function mapRegionCode(code: string): string {
  return REGION_CODE_MAP[code] || code
}

// Convert ALL CAPS names to Title Case (eerste letter hoofdletter)
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .split("-")
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("-")
}

function formatInt(n: number) {
  return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
}

// Hooks for lazy-loaded data
function useVastgoedData() {
  const [yearlyData, setYearlyData] = React.useState<YearlyRow[] | null>(null)
  const [quarterlyData, setQuarterlyData] = React.useState<QuarterlyRow[] | null>(null)
  const [municipalitiesData, setMunicipalitiesData] = React.useState<any[] | null>(null)
  const [lookupsData, setLookupsData] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()
    const FETCH_TIMEOUT = 30000 // 30 seconds timeout

    async function loadData() {
      try {
        // Helper function to fetch with timeout
        const fetchWithTimeout = async (url: string) => {
          const timeoutId = setTimeout(() => abortController.abort(), FETCH_TIMEOUT)
          try {
            const response = await fetch(url, { signal: abortController.signal })
            clearTimeout(timeoutId)
            if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`)
            return response.json()
          } catch (err) {
            clearTimeout(timeoutId)
            if (err instanceof Error && err.name === 'AbortError') {
              throw new Error(`Request timeout loading ${url}`)
            }
            throw err
          }
        }

        // Load metadata first to know how many chunks
        const metadata = await fetchWithTimeout(getDataPath("/data/vastgoed-verkopen/metadata.json"))

        console.log(`Loading vastgoed data: ${metadata.quarterly_chunks} quarterly chunks`)

        // Load all data in parallel
        const [yearly, municipalities, lookups, ...quarterlyChunks] = await Promise.all([
          fetchWithTimeout(getDataPath("/data/vastgoed-verkopen/yearly.json")),
          fetchWithTimeout(getDataPath("/data/vastgoed-verkopen/municipalities.json")),
          fetchWithTimeout(getDataPath("/data/vastgoed-verkopen/lookups.json")),
          ...Array.from({ length: metadata.quarterly_chunks }, (_, i) =>
            fetchWithTimeout(getDataPath(`/data/vastgoed-verkopen/quarterly_chunk_${i}.json`))
          )
        ])

        // Merge quarterly chunks
        const quarterly = quarterlyChunks.flat()
        console.log(`Loaded ${quarterly.length} quarterly records from ${metadata.quarterly_chunks} chunks`)

        // Only update state if component is still mounted
        if (isMounted) {
          setYearlyData(yearly)
          setQuarterlyData(quarterly)
          setMunicipalitiesData(municipalities)
          setLookupsData(lookups)
          setLoading(false)
        }
      } catch (err) {
        console.error("Error loading vastgoed data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load data")
          setLoading(false)
        }
      }
    }

    loadData()

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [])

  return { yearlyData, quarterlyData, municipalitiesData, lookupsData, loading, error }
}

function usePropertyTypeOptions(lookupsData: any): PropertyType[] {
  return lookupsData?.property_types ?? []
}

function useRegionOptions(lookupsData: any): GeoEntity[] {
  return (lookupsData?.regions ?? []).map((r: GeoEntity) => ({
    ...r,
    code: mapRegionCode(r.code),
  }))
}

function useProvinceOptions(lookupsData: any): GeoEntity[] {
  return lookupsData?.provinces ?? []
}

function useMunicipalityOptions(lookupsData: any): GeoEntity[] {
  // Municipalities are not currently available in lookups
  return []
}

// Geo filter inline component
function GeoFilterInline({
  selectedLevel,
  selectedNis,
  onSelect,
  lookupsData,
}: {
  selectedLevel: "belgium" | "region" | "province" | "municipality"
  selectedNis: string | null
  onSelect: (level: "belgium" | "region" | "province" | "municipality", nis: string | null) => void
  lookupsData: any
}) {
  const [open, setOpen] = React.useState(false)
  const regions = useRegionOptions(lookupsData)
  const provinces = useProvinceOptions(lookupsData)
  const municipalities = useMunicipalityOptions(lookupsData)

  const currentLabel = React.useMemo(() => {
    if (selectedLevel === "belgium" || !selectedNis) return "België"
    if (selectedLevel === "region") {
      const name = regions.find((r) => r.code === selectedNis)?.name ?? "Regio"
      return toTitleCase(name)
    }
    if (selectedLevel === "province") {
      const name = provinces.find((p) => p.code === selectedNis)?.name ?? "Provincie"
      return toTitleCase(name)
    }
    if (selectedLevel === "municipality") {
      const name = municipalities.find((m) => m.code === selectedNis)?.name ?? "Gemeente"
      return toTitleCase(name)
    }
    return "België"
  }, [selectedLevel, selectedNis, regions, provinces, municipalities])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="h-9 gap-1 min-w-[140px]">
          <span className="truncate max-w-[120px]">{currentLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Zoek locatie..." />
          <CommandList>
            <CommandEmpty>Geen resultaat.</CommandEmpty>
            <CommandGroup heading="Land">
              <CommandItem
                value="België"
                onSelect={() => {
                  onSelect("belgium", null)
                  setOpen(false)
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", selectedLevel === "belgium" ? "opacity-100" : "opacity-0")} />
                België
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Regio">
              {regions.map((r) => (
                <CommandItem
                  key={r.code}
                  value={r.name}
                  onSelect={() => {
                    onSelect("region", r.code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedLevel === "region" && selectedNis === r.code ? "opacity-100" : "opacity-0")} />
                  {toTitleCase(r.name)}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Provincie">
              {provinces.map((p) => (
                <CommandItem
                  key={p.code}
                  value={p.name}
                  onSelect={() => {
                    onSelect("province", p.code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedLevel === "province" && selectedNis === p.code ? "opacity-100" : "opacity-0")} />
                  {toTitleCase(p.name)}
                </CommandItem>
              ))}
            </CommandGroup>
            {municipalities.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Gemeente">
                  {municipalities.slice(0, 100).map((m) => (
                    <CommandItem
                      key={m.code}
                      value={m.name}
                      onSelect={() => {
                        onSelect("municipality", m.code)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedLevel === "municipality" && selectedNis === m.code ? "opacity-100" : "opacity-0")} />
                      {toTitleCase(m.name)}
                    </CommandItem>
                  ))}
                  {municipalities.length > 100 && (
                    <CommandItem disabled>
                      <span className="text-xs text-muted-foreground">... en {municipalities.length - 100} meer</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Property type filter
function PropertyTypeFilterInline({
  selected,
  onChange,
  lookupsData,
}: {
  selected: string
  onChange: (code: string) => void
  lookupsData: any
}) {
  const [open, setOpen] = React.useState(false)
  const options = usePropertyTypeOptions(lookupsData)

  const selectedLabel = React.useMemo(() => {
    const opt = options.find((o) => o.code === selected)
    return opt ? opt.nl.split("(")[0].trim() : selected
  }, [selected, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="h-9 gap-1 min-w-[140px]">
          <span className="truncate max-w-[120px]">{selectedLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Zoek type..." />
          <CommandList>
            <CommandEmpty>Geen resultaat.</CommandEmpty>
            <CommandGroup heading="Type vastgoed">
              {options.map((o) => (
                <CommandItem
                  key={o.code}
                  value={o.nl}
                  onSelect={() => {
                    onChange(o.code)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === o.code ? "opacity-100" : "opacity-0")} />
                  {o.nl}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Filter functions
function filterYearlyByGeo(rows: YearlyRow[], level: "belgium" | "region" | "province" | "municipality", nis: string | null): YearlyRow[] {
  if (level === "belgium") {
    return rows.filter((r) => r.lvl === 1)
  }
  if (level === "region" && nis) {
    // Match both formats: "2000" and "02000"
    const nisWithZero = nis.padStart(5, "0")
    return rows.filter((r) => r.lvl === 2 && (r.nis === nis || r.nis === nisWithZero))
  }
  if (level === "province" && nis) {
    return rows.filter((r) => r.lvl === 3 && r.nis === nis)
  }
  if (level === "municipality" && nis) {
    return rows.filter((r) => r.lvl === 5 && r.nis === nis)
  }
  return rows.filter((r) => r.lvl === 1)
}

function filterByPropertyType(rows: YearlyRow[], type: string): YearlyRow[] {
  return rows.filter((r) => r.type === type)
}

function filterQuarterlyByType(rows: QuarterlyRow[], type: string): QuarterlyRow[] {
  return rows.filter((r) => r.type === type)
}

function filterQuarterlyByGeo(rows: QuarterlyRow[], level: "belgium" | "region" | "province" | "municipality", nis: string | null): QuarterlyRow[] {
  if (level === "belgium") {
    return rows.filter((r) => r.lvl === 1)
  }
  if (level === "region" && nis) {
    const nisWithZero = nis.padStart(5, "0")
    return rows.filter((r) => r.lvl === 2 && (r.nis === nis || r.nis === nisWithZero))
  }
  if (level === "province" && nis) {
    return rows.filter((r) => r.lvl === 3 && r.nis === nis)
  }
  if (level === "municipality" && nis) {
    return rows.filter((r) => r.lvl === 5 && r.nis === nis)
  }
  return rows.filter((r) => r.lvl === 1)
}

// Aggregation functions
function aggregateTransactionsByYear(rows: YearlyRow[]): YearPoint[] {
  const agg = new Map<number, number>()
  for (const r of rows) {
    if (typeof r.y !== "number" || typeof r.n !== "number") continue
    agg.set(r.y, (agg.get(r.y) ?? 0) + r.n)
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: v }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateMedianPriceByYear(rows: YearlyRow[]): YearPoint[] {
  // For median price, we take the p50 value (since already aggregated per level)
  const agg = new Map<number, number>()
  for (const r of rows) {
    if (typeof r.y !== "number" || typeof r.p50 !== "number") continue
    agg.set(r.y, r.p50) // Take the value directly, not sum
  }
  return Array.from(agg.entries())
    .map(([y, v]) => ({ sortValue: y, periodCells: [y], value: v }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateByQuarter(rows: QuarterlyRow[], metric: "n" | "p50"): YearPoint[] {
  return rows
    .filter((r) => typeof r.y === "number" && typeof r.q === "number" && typeof r[metric] === "number")
    .map((r) => ({
      sortValue: r.y * 10 + r.q,
      periodCells: [r.y, `Q${r.q}`],
      value: r[metric],
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
}

function aggregateByRegionAllYears(rows: YearlyRow[], metric: "n" | "p50"): RegionPoint[] {
  const regionRows = rows.filter((r) => r.lvl === 2 && typeof r.y === "number")
  return regionRows.map((r) => ({
    r: mapRegionCode(r.nis),
    y: r.y,
    value: r[metric],
  }))
}

function aggregateByProvinceAllYears(rows: YearlyRow[], metric: "n" | "p50"): ProvincePoint[] {
  const provRows = rows.filter((r) => r.lvl === 3 && typeof r.y === "number")
  return provRows.map((r) => ({
    p: r.nis,
    y: r.y,
    value: r[metric],
  }))
}

type MunicipalityPoint = {
  m: string
  y: number
  value: number
}

function aggregateByMunicipalityAllYears(rows: YearlyRow[], metric: "n" | "p50"): MunicipalityPoint[] {
  const munRows = rows.filter((r) => r.lvl === 5 && typeof r.y === "number")
  return munRows.map((r) => ({
    m: r.nis,
    y: r.y,
    value: r[metric],
  }))
}

// Metric Section Component
function MetricSection({
  title,
  label,
  yearSeries,
  mapData,
  years,
  mapLevel,
  formatValue,
  geoLevel,
  selectedNis,
  selectedType,
  onSelectGeo,
  onSelectType,
  slug,
  sectionId,
  dataSource,
  dataSourceUrl,
  embedParams,
  municipalitiesData,
  lookupsData,
}: {
  title: string
  label: string
  yearSeries: YearPoint[]
  mapData: RegionPoint[] | ProvincePoint[] | MunicipalityPoint[]
  years: number[]
  mapLevel: "region" | "province" | "municipality"
  formatValue: (v: number) => string
  geoLevel: "belgium" | "region" | "province" | "municipality"
  selectedNis: string | null
  selectedType: string
  onSelectGeo: (level: "belgium" | "region" | "province" | "municipality", nis: string | null) => void
  onSelectType: (code: string) => void
  slug?: string
  sectionId?: string
  dataSource?: string
  dataSourceUrl?: string
  embedParams?: Record<string, string | number | null | undefined>
  municipalitiesData: any[]
  lookupsData: any
}) {
  const [currentView, setCurrentView] = React.useState<"chart" | "table" | "map">("chart")

  const exportData = React.useMemo(
    () =>
      yearSeries.map((d) => ({
        label: d.periodCells.join("-"),
        value: d.value,
        periodCells: d.periodCells,
      })),
    [yearSeries]
  )

  // Summary statistics
  const latestValue = yearSeries.length > 0 ? yearSeries[yearSeries.length - 1].value : null
  const previousValue = yearSeries.length > 1 ? yearSeries[yearSeries.length - 2].value : null
  const change = latestValue && previousValue ? ((latestValue - previousValue) / previousValue) * 100 : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {slug && sectionId && (
          <ExportButtons
            data={exportData}
            title={title}
            slug={slug}
            sectionId={sectionId}
            viewType={currentView}
            periodHeaders={["Jaar"]}
            valueLabel={label}
            dataSource={dataSource}
            dataSourceUrl={dataSourceUrl}
            embedParams={embedParams}
          />
        )}
      </div>

      {/* Summary cards */}
      {latestValue !== null && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Meest recent</div>
              <div className="text-2xl font-bold">{formatValue(latestValue)}</div>
            </CardContent>
          </Card>
          {change !== null && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Verandering</div>
                <div className={cn("text-2xl font-bold", change >= 0 ? "text-green-600" : "text-red-600")}>
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table" | "map")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
            <TabsTrigger value="map">Kaart</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline selectedLevel={geoLevel} selectedNis={selectedNis} onSelect={onSelectGeo} lookupsData={lookupsData} />
            <PropertyTypeFilterInline selected={selectedType} onChange={onSelectType} lookupsData={lookupsData} />
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie per jaar</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={yearSeries}
                getLabel={(d) => String((d as YearPoint).periodCells[0])}
                getValue={(d) => (d as YearPoint).value}
                getSortValue={(d) => (d as YearPoint).sortValue}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={yearSeries} label={label} periodHeaders={["Jaar"]} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <MapSection
            data={municipalitiesData}
            getGeoCode={(d: any) => d.nis}
            getValue={(d: any) => (label === "Mediane prijs" ? d.p50 : d.n) ?? 0}
            getPeriod={(d: any) => d.y}
            periods={years}
            showTimeSlider={years.length > 1}
            formatValue={formatValue}
            tooltipLabel={label}
            showProvinceBoundaries={true}
            colorScheme={label === "Mediane prijs" ? "orange" : "blue"}
            height={500}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Quarterly Metric Section Component (with geo filter support)
function QuarterlyMetricSection({
  title,
  label,
  quarterlySeries,
  formatValue,
  geoLevel,
  selectedNis,
  selectedType,
  onSelectGeo,
  onSelectType,
  slug,
  sectionId,
  dataSource,
  dataSourceUrl,
  embedParams,
  municipalitiesData,
  lookupsData,
}: {
  title: string
  label: string
  quarterlySeries: YearPoint[]
  formatValue: (v: number) => string
  geoLevel: "belgium" | "region" | "province" | "municipality"
  selectedNis: string | null
  selectedType: string
  onSelectGeo: (level: "belgium" | "region" | "province" | "municipality", nis: string | null) => void
  onSelectType: (code: string) => void
  slug?: string
  sectionId?: string
  dataSource?: string
  dataSourceUrl?: string
  embedParams?: Record<string, string | number | null | undefined>
  municipalitiesData: any[]
  lookupsData: any
}) {
  const [currentView, setCurrentView] = React.useState<"chart" | "table" | "map">("chart")

  const exportData = React.useMemo(
    () =>
      quarterlySeries.map((d) => ({
        label: `${d.periodCells[0]} ${d.periodCells[1]}`,
        value: d.value,
        periodCells: d.periodCells,
      })),
    [quarterlySeries]
  )

  // Summary statistics
  const latestValue = quarterlySeries.length > 0 ? quarterlySeries[quarterlySeries.length - 1].value : null
  const previousValue = quarterlySeries.length > 1 ? quarterlySeries[quarterlySeries.length - 2].value : null
  const change = latestValue && previousValue ? ((latestValue - previousValue) / previousValue) * 100 : null

  // Year-over-year change (compare with same quarter previous year)
  const yoyChange = React.useMemo(() => {
    if (quarterlySeries.length < 5) return null
    const latest = quarterlySeries[quarterlySeries.length - 1]
    const sameQuarterLastYear = quarterlySeries.find(
      (d) => d.periodCells[0] === (latest.periodCells[0] as number) - 1 && d.periodCells[1] === latest.periodCells[1]
    )
    if (!sameQuarterLastYear) return null
    return ((latest.value - sameQuarterLastYear.value) / sameQuarterLastYear.value) * 100
  }, [quarterlySeries])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {slug && sectionId && (
          <ExportButtons
            data={exportData}
            title={title}
            slug={slug}
            sectionId={sectionId}
            viewType={currentView}
            periodHeaders={["Jaar", "Kwartaal"]}
            valueLabel={label}
            dataSource={dataSource}
            dataSourceUrl={dataSourceUrl}
            embedParams={embedParams}
          />
        )}
      </div>

      {/* Summary cards */}
      {latestValue !== null && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Meest recent</div>
              <div className="text-2xl font-bold">{formatValue(latestValue)}</div>
            </CardContent>
          </Card>
          {change !== null && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">vs vorig kwartaal</div>
                <div className={cn("text-2xl font-bold", change >= 0 ? "text-green-600" : "text-red-600")}>
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          )}
          {yoyChange !== null && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">vs zelfde kwartaal vorig jaar</div>
                <div className={cn("text-2xl font-bold", yoyChange >= 0 ? "text-green-600" : "text-red-600")}>
                  {yoyChange >= 0 ? "+" : ""}
                  {yoyChange.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="chart" onValueChange={(v) => setCurrentView(v as "chart" | "table" | "map")}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="chart">Grafiek</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
            <TabsTrigger value="map">Kaart</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <GeoFilterInline selectedLevel={geoLevel} selectedNis={selectedNis} onSelect={onSelectGeo} lookupsData={lookupsData} />
            <PropertyTypeFilterInline selected={selectedType} onChange={onSelectType} lookupsData={lookupsData} />
          </div>
        </div>
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolutie per kwartaal</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableChart
                data={quarterlySeries}
                getLabel={(d) => `${(d as YearPoint).periodCells[0]} ${(d as YearPoint).periodCells[1]}`}
                getValue={(d) => (d as YearPoint).value}
                getSortValue={(d) => (d as YearPoint).sortValue}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterableTable data={quarterlySeries} label={label} periodHeaders={["Jaar", "Kwartaal"]} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <div className="text-sm text-muted-foreground mb-4">
            Kaart toont jaarlijkse data (kwartaaldata niet beschikbaar op gemeenteniveau)
          </div>
          <MapSection
            data={municipalitiesData}
            getGeoCode={(d: any) => d.nis}
            getValue={(d: any) => (label === "Mediane prijs" ? d.p50 : d.n) ?? 0}
            getPeriod={(d: any) => d.y}
            periods={Array.from(new Set(municipalitiesData.map((d: any) => d.y))).sort()}
            showTimeSlider={true}
            formatValue={formatValue}
            tooltipLabel={label}
            showProvinceBoundaries={true}
            colorScheme={label === "Mediane prijs" ? "orange" : "blue"}
            height={500}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Main Dashboard Component
function InnerDashboard() {
  const { yearlyData, quarterlyData, municipalitiesData, lookupsData, loading, error } = useVastgoedData()
  const [geoLevel, setGeoLevel] = React.useState<"belgium" | "region" | "province" | "municipality">("belgium")
  const [selectedNis, setSelectedNis] = React.useState<string | null>(null)
  const [selectedType, setSelectedType] = React.useState<string>("alle_huizen")
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch by only rendering after client mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything on server to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Vastgoeddata laden...</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Vastgoeddata laden...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !yearlyData || !quarterlyData || !municipalitiesData || !lookupsData) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Fout bij het laden van de data: {error || "Onbekende fout"}</p>
      </div>
    )
  }

  const yearlyRows = yearlyData
  const quarterlyRows = quarterlyData

  // Filter data
  const filteredYearly = React.useMemo(() => {
    const byGeo = filterYearlyByGeo(yearlyRows, geoLevel, selectedNis)
    return filterByPropertyType(byGeo, selectedType)
  }, [yearlyRows, geoLevel, selectedNis, selectedType])

  const filteredQuarterly = React.useMemo(() => {
    const byGeo = filterQuarterlyByGeo(quarterlyRows, geoLevel, selectedNis)
    return filterQuarterlyByType(byGeo, selectedType)
  }, [quarterlyRows, geoLevel, selectedNis, selectedType])

  // Aggregated series
  const transactionsSeries = React.useMemo(() => aggregateTransactionsByYear(filteredYearly), [filteredYearly])
  const priceSeries = React.useMemo(() => aggregateMedianPriceByYear(filteredYearly), [filteredYearly])
  const quarterlyTransactions = React.useMemo(() => aggregateByQuarter(filteredQuarterly, "n"), [filteredQuarterly])
  const quarterlyPrices = React.useMemo(() => aggregateByQuarter(filteredQuarterly, "p50"), [filteredQuarterly])

  // Get all years for time slider
  const years = React.useMemo(() => {
    const yearSet = new Set<number>()
    for (const r of yearlyRows) {
      if (typeof r.y === "number") yearSet.add(r.y)
    }
    return Array.from(yearSet).sort((a, b) => a - b)
  }, [yearlyRows])

  // Map data - filter by selected type (all years for time slider)
  const transactionsMapRegion = React.useMemo(() => {
    const filtered = filterByPropertyType(yearlyRows, selectedType)
    return aggregateByRegionAllYears(filtered, "n")
  }, [yearlyRows, selectedType])

  const transactionsMapProvince = React.useMemo(() => {
    const filtered = filterByPropertyType(yearlyRows, selectedType)
    return aggregateByProvinceAllYears(filtered, "n")
  }, [yearlyRows, selectedType])

  const priceMapRegion = React.useMemo(() => {
    const filtered = filterByPropertyType(yearlyRows, selectedType)
    return aggregateByRegionAllYears(filtered, "p50")
  }, [yearlyRows, selectedType])

  const priceMapProvince = React.useMemo(() => {
    const filtered = filterByPropertyType(yearlyRows, selectedType)
    return aggregateByProvinceAllYears(filtered, "p50")
  }, [yearlyRows, selectedType])

  const transactionsMapMunicipality = React.useMemo(() => {
    const filtered = filterByPropertyType(yearlyRows, selectedType)
    return aggregateByMunicipalityAllYears(filtered, "n")
  }, [yearlyRows, selectedType])

  const priceMapMunicipality = React.useMemo(() => {
    const filtered = filterByPropertyType(yearlyRows, selectedType)
    return aggregateByMunicipalityAllYears(filtered, "p50")
  }, [yearlyRows, selectedType])

  // Determine map level based on current geo selection
  const mapLevel =
    geoLevel === "province" && selectedNis ? "municipality" :
    geoLevel === "region" && selectedNis ? "province" :
    "region"

  function handleSelectGeo(level: "belgium" | "region" | "province" | "municipality", nis: string | null) {
    setGeoLevel(level)
    setSelectedNis(nis)
  }

  return (
    <div className="space-y-10">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Deze analyse toont de verkoop van vastgoed in België: aantal transacties en mediaanprijzen per type woning.
          De data is afkomstig van Statbel en wordt kwartaalsgewijs bijgewerkt.
        </p>
      </div>

      <MetricSection
        title="Aantal transacties"
        label="Transacties"
        yearSeries={transactionsSeries}
        mapData={
          mapLevel === "municipality" ? transactionsMapMunicipality :
          mapLevel === "province" ? transactionsMapProvince :
          transactionsMapRegion
        }
        years={years}
        mapLevel={mapLevel}
        formatValue={formatInt}
        geoLevel={geoLevel}
        selectedNis={selectedNis}
        selectedType={selectedType}
        onSelectGeo={handleSelectGeo}
        onSelectType={setSelectedType}
        slug="vastgoed-verkopen"
        sectionId="transacties"
        dataSource="Statbel - Verkoop van onroerende goederen"
        dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/vastgoedprijzen"
        embedParams={{
          geo: geoLevel !== "belgium" ? selectedNis : null,
          type: selectedType,
        }}
        municipalitiesData={municipalitiesData}
        lookupsData={lookupsData}
      />

      <MetricSection
        title="Mediaanprijs"
        label="Prijs (€)"
        yearSeries={priceSeries}
        mapData={
          mapLevel === "municipality" ? priceMapMunicipality :
          mapLevel === "province" ? priceMapProvince :
          priceMapRegion
        }
        years={years}
        mapLevel={mapLevel}
        formatValue={formatPrice}
        geoLevel={geoLevel}
        selectedNis={selectedNis}
        selectedType={selectedType}
        onSelectGeo={handleSelectGeo}
        onSelectType={setSelectedType}
        slug="vastgoed-verkopen"
        sectionId="prijzen"
        dataSource="Statbel - Verkoop van onroerende goederen"
        dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/vastgoedprijzen"
        embedParams={{
          geo: geoLevel !== "belgium" ? selectedNis : null,
          type: selectedType,
        }}
        municipalitiesData={municipalitiesData}
        lookupsData={lookupsData}
      />

      <QuarterlyMetricSection
        title="Transacties per kwartaal"
        label="Transacties"
        quarterlySeries={quarterlyTransactions}
        formatValue={formatInt}
        geoLevel={geoLevel}
        selectedNis={selectedNis}
        selectedType={selectedType}
        onSelectGeo={handleSelectGeo}
        onSelectType={setSelectedType}
        slug="vastgoed-verkopen"
        sectionId="transacties-kwartaal"
        dataSource="Statbel - Verkoop van onroerende goederen"
        dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/vastgoedprijzen"
        embedParams={{
          geo: geoLevel !== "belgium" ? selectedNis : null,
          type: selectedType,
        }}
        municipalitiesData={municipalitiesData}
        lookupsData={lookupsData}
      />

      <QuarterlyMetricSection
        title="Mediaanprijs per kwartaal"
        label="Prijs (€)"
        quarterlySeries={quarterlyPrices}
        formatValue={formatPrice}
        geoLevel={geoLevel}
        selectedNis={selectedNis}
        selectedType={selectedType}
        onSelectGeo={handleSelectGeo}
        onSelectType={setSelectedType}
        slug="vastgoed-verkopen"
        sectionId="prijzen-kwartaal"
        dataSource="Statbel - Verkoop van onroerende goederen"
        dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/vastgoedprijzen"
        embedParams={{
          geo: geoLevel !== "belgium" ? selectedNis : null,
          type: selectedType,
        }}
        municipalitiesData={municipalitiesData}
        lookupsData={lookupsData}
      />
    </div>
  )
}

export function VastgoedDashboard() {
  return (
    <GeoProvider>
      <InnerDashboard />
    </GeoProvider>
  )
}
