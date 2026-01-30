"use client"

import { useMemo, useState, useEffect } from "react"
import { FilterableChart } from "../shared/FilterableChart"
import { FilterableTable } from "../shared/FilterableTable"
import { getDataPath } from "@/lib/path-utils"

import { useJsonBundle } from "@/lib/use-json-bundle"

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

type YearPoint = {
  sortValue: number
  periodCells: Array<string | number>
  value: number
}

type SectionType = "transacties" | "prijzen" | "transacties-kwartaal" | "prijzen-kwartaal"
type ViewType = "chart" | "table"
type GeoLevel = "belgium" | "region" | "province"

function inferGeoLevelAndCode(geo: string | null | undefined): { level: GeoLevel; code: string | null } {
  if (!geo) return { level: "belgium", code: null }

  // Common "Belgium" codes across the project.
  if (geo === "1000" || geo === "01000") return { level: "belgium", code: null }

  // Regions are typically "2000/3000/4000" but data also contains "02000/03000/04000".
  if (geo === "2000" || geo === "3000" || geo === "4000" || geo === "02000" || geo === "03000" || geo === "04000") {
    return { level: "region", code: geo }
  }

  // Heuristic:
  // - 4 digits => region (2000/3000/4000)
  // - 5 digits starting with 0 => region (02000/03000/04000)
  // - otherwise assume province (10000/20001/...)
  if (/^\d{4}$/.test(geo)) return { level: "region", code: geo }
  if (/^0\d{4}$/.test(geo)) return { level: "region", code: geo }
  return { level: "province", code: geo }
}

function filterYearlyByGeo(rows: YearlyRow[], geo: string | null | undefined): YearlyRow[] {
  const { level, code } = inferGeoLevelAndCode(geo)
  if (level === "belgium") return rows.filter((r) => r.lvl === 1)
  if (level === "region" && code) {
    const codeWithZero = code.padStart(5, "0")
    return rows.filter((r) => r.lvl === 2 && (r.nis === code || r.nis === codeWithZero))
  }
  if (level === "province" && code) return rows.filter((r) => r.lvl === 3 && r.nis === code)
  return rows.filter((r) => r.lvl === 1)
}

function filterQuarterlyByGeo(rows: QuarterlyRow[], geo: string | null | undefined): QuarterlyRow[] {
  const { level, code } = inferGeoLevelAndCode(geo)
  if (level === "belgium") return rows.filter((r) => r.lvl === 1)
  if (level === "region" && code) {
    const codeWithZero = code.padStart(5, "0")
    return rows.filter((r) => r.lvl === 2 && (r.nis === code || r.nis === codeWithZero))
  }
  if (level === "province" && code) return rows.filter((r) => r.lvl === 3 && r.nis === code)
  return rows.filter((r) => r.lvl === 1)
}

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
  const agg = new Map<number, number>()
  for (const r of rows) {
    if (typeof r.y !== "number" || typeof r.p50 !== "number") continue
    agg.set(r.y, r.p50)
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

interface VastgoedVerkopenEmbedProps {
  section: SectionType
  viewType: ViewType
  type?: string | null
  geo?: string | null
}

export function VastgoedVerkopenEmbed({
  section,
  viewType,
  type = "alle_huizen",
  geo = null,
}: VastgoedVerkopenEmbedProps) {
  const { data: bundle, loading: bundleLoading, error: bundleError } = useJsonBundle<{
    yearly: YearlyRow[]
  }>({
    yearly: "/analyses/vastgoed-verkopen/results/yearly.json",
  })

  const yearlyRows = useMemo(() => (bundle?.yearly as YearlyRow[]) ?? [], [bundle?.yearly])
  const [quarterlyRows, setQuarterlyRows] = useState<QuarterlyRow[]>([])
  const [quarterlyLoading, setQuarterlyLoading] = useState(false)
  const [quarterlyError, setQuarterlyError] = useState<string | null>(null)

  // Load quarterly data only if needed
  const needsQuarterly = section.includes("kwartaal")

  useEffect(() => {
    if (!needsQuarterly) return

    let isMounted = true
    const abortController = new AbortController()

    async function loadQuarterlyData() {
      setQuarterlyLoading(true)
      setQuarterlyError(null)
      try {
        const metadata = await fetch(getDataPath("/data/vastgoed-verkopen/metadata.json"), {
          signal: abortController.signal,
        }).then((r) => r.json())

        const chunks = await Promise.all(
          Array.from({ length: metadata.quarterly_chunks }, (_, i) =>
            fetch(getDataPath(`/data/vastgoed-verkopen/quarterly_chunk_${i}.json`), {
              signal: abortController.signal,
            }).then((r) => r.json())
          )
        )

        const quarterly = chunks.flat()
        if (isMounted) {
          setQuarterlyRows(quarterly)
          setQuarterlyLoading(false)
        }
      } catch (err) {
        if (isMounted && err instanceof Error && err.name !== "AbortError") {
          setQuarterlyError(err.message)
          setQuarterlyLoading(false)
        }
      }
    }

    loadQuarterlyData()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [needsQuarterly])

  // Filter by geo + property type
  const filteredYearly = useMemo(() => {
    return filterYearlyByGeo(yearlyRows, geo).filter((r) => r.type === type)
  }, [yearlyRows, geo, type])

  const filteredQuarterly = useMemo(() => {
    return filterQuarterlyByGeo(quarterlyRows, geo).filter((r) => r.type === type)
  }, [quarterlyRows, geo, type])

  // Compute the appropriate data series based on section
  const yearSeries = useMemo(() => {
    switch (section) {
      case "transacties":
        return aggregateTransactionsByYear(filteredYearly)
      case "prijzen":
        return aggregateMedianPriceByYear(filteredYearly)
      case "transacties-kwartaal":
        return aggregateByQuarter(filteredQuarterly, "n")
      case "prijzen-kwartaal":
        return aggregateByQuarter(filteredQuarterly, "p50")
    }
  }, [section, filteredYearly, filteredQuarterly])

  // Build title
  const title = useMemo(() => {
    switch (section) {
      case "transacties":
        return "Aantal transacties"
      case "prijzen":
        return "Mediaanprijs"
      case "transacties-kwartaal":
        return "Transacties per kwartaal"
      case "prijzen-kwartaal":
        return "Mediaanprijs per kwartaal"
    }
  }, [section])

  if (bundleLoading) {
    return <div className="p-4">Data laden...</div>
  }

  if (bundleError || !bundle) {
    return (
      <div className="p-4 text-sm text-destructive">
        Fout bij het laden van data: {bundleError ?? "Onbekende fout"}
      </div>
    )
  }

  const isQuarterly = section.includes("kwartaal")
  const isPriceMetric = section.includes("prijzen")
  const label = isPriceMetric ? "Prijs (€)" : "Transacties"
  const periodHeaders = isQuarterly ? ["Jaar", "Kwartaal"] : ["Jaar"]
  const hasData = yearSeries.length > 0

  // Show loading state for quarterly data
  if (needsQuarterly && quarterlyLoading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Data laden...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (quarterlyError) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="p-8 text-center text-destructive">
          <p>Fout bij het laden van de data: {quarterlyError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {!hasData && (
        <div className="p-8 text-center text-muted-foreground">
          <p>Geen data beschikbaar voor deze selectie.</p>
          <p className="text-sm mt-2">Controleer je filters (bv. `geo` en `type`).</p>
        </div>
      )}

      {viewType === "chart" && (
        <FilterableChart
          data={yearSeries}
          getLabel={(d) =>
            isQuarterly
              ? `${(d as YearPoint).periodCells[0]} ${(d as YearPoint).periodCells[1]}`
              : String((d as YearPoint).periodCells[0])
          }
          getValue={(d) => (d as YearPoint).value}
          getSortValue={(d) => (d as YearPoint).sortValue}
        />
      )}

      {viewType === "table" && (
        <FilterableTable data={yearSeries} label={label} periodHeaders={periodHeaders} />
      )}

      <div className="mt-4 text-xs text-muted-foreground text-center">
        <span>Bron: Statbel</span>
      </div>
    </div>
  )
}
