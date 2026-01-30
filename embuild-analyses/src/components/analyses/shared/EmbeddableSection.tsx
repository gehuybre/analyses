"use client"

import { useMemo } from "react"
import { FilterableChart } from "./FilterableChart"
import { FilterableTable } from "./FilterableTable"
import { MapSection } from "./MapSection"
import { Municipality } from "@/lib/geo-utils"
import { getEmbedConfig } from "@/lib/embed-config"
import { getDataPath } from "@/lib/path-utils"

type UnknownRecord = Record<string, unknown>

type PeriodTableConfig<TData> = {
  headers: string[]
  cells: (d: TData) => Array<string | number>
}

type PeriodConfig<TData> = {
  key?: (d: TData) => string
  sortValue?: (d: TData) => number
  label?: (d: TData) => string
  table?: PeriodTableConfig<TData>
}

type AggregatedPoint = {
  label: string
  sortValue: number
  value: number
  periodCells: Array<string | number>
}

interface EmbeddableSectionProps<TData extends object = UnknownRecord> {
  slug: string
  section: string
  title: string
  data: TData[]
  municipalities: Municipality[]
  metric: string
  label?: string
  viewType: "chart" | "table" | "map"
  getMunicipalityCode?: (d: TData) => number
  getMetricValue?: (d: TData, metric: string) => number
  period?: PeriodConfig<TData>
  timeRange?: string | null
}

export function EmbeddableSection<TData extends object = UnknownRecord>({
  slug,
  section,
  title,
  data,
  municipalities,
  metric,
  label,
  viewType,
  getMunicipalityCode,
  getMetricValue,
  period,
  timeRange,
}: EmbeddableSectionProps<TData>) {
  const municipalityCodeGetter =
    getMunicipalityCode ?? ((d: unknown) => Number((d as Record<string, unknown>)?.m))
  const metricGetter =
    getMetricValue ?? ((d: unknown, m: string) => Number((d as Record<string, unknown>)?.[m] ?? 0))

  // Determine period configuration based on timeRange parameter
  // If timeRange is "yearly", aggregate to year level; if "monthly", use month level (if mo field exists)
  // Default to quarterly if no timeRange specified
  const effectiveTimeRange = timeRange || "quarterly"

  const periodKeyGetter = useMemo(() => {
    if (period?.key) return period.key

    return (d: unknown) => {
      const rec = d as Record<string, unknown>
      if (effectiveTimeRange === "yearly") {
        return `${rec?.y}`
      }
      if (effectiveTimeRange === "monthly" && rec?.mo) {
        return `${rec?.y}-${String(rec?.mo).padStart(2, '0')}`
      }
      return `${rec?.y}-${rec?.q}`
    }
  }, [period, effectiveTimeRange])

  const periodSortGetter = useMemo(() => {
    if (period?.sortValue) return period.sortValue

    return (d: unknown) => {
      const rec = d as Record<string, unknown>
      const year = Number(rec?.y) || 0
      if (effectiveTimeRange === "yearly") {
        return year
      }
      if (effectiveTimeRange === "monthly" && rec?.mo) {
        return year * 100 + (Number(rec?.mo) || 0)
      }
      return year * 10 + (Number(rec?.q) || 0)
    }
  }, [period, effectiveTimeRange])

  const periodLabelGetter = useMemo(() => {
    if (period?.label) return period.label

    return (d: unknown) => {
      const rec = d as Record<string, unknown>
      if (effectiveTimeRange === "yearly") {
        return `${rec?.y}`
      }
      if (effectiveTimeRange === "monthly" && rec?.mo) {
        return `${rec?.y}-${String(rec?.mo).padStart(2, '0')}`
      }
      return `${rec?.y} Q${rec?.q}`
    }
  }, [period, effectiveTimeRange])

  const periodTable = useMemo(() => {
    if (period?.table) return period.table

    if (effectiveTimeRange === "yearly") {
      return {
        headers: ["Jaar"],
        cells: (d: unknown) => {
          const rec = d as Record<string, unknown>
          return [rec?.y as number]
        },
      } satisfies PeriodTableConfig<unknown>
    }

    if (effectiveTimeRange === "monthly") {
      return {
        headers: ["Jaar", "Maand"],
        cells: (d: unknown) => {
          const rec = d as Record<string, unknown>
          // Guard for missing mo field - fall back to quarterly if mo doesn't exist
          if (rec?.mo === undefined || rec?.mo === null) {
            return [rec?.y as number, `Q${rec?.q ?? '?'}`]
          }
          return [rec?.y as number, String(rec?.mo).padStart(2, '0')]
        },
      } satisfies PeriodTableConfig<unknown>
    }

    return {
      headers: ["Jaar", "Kwartaal"],
      cells: (d: unknown) => {
        const rec = d as Record<string, unknown>
        return [rec?.y as number, `Q${rec?.q}`]
      },
    } satisfies PeriodTableConfig<unknown>
  }, [period, effectiveTimeRange])

  const chartData = useMemo(() => {
    console.log('[EmbeddableSection] Aggregating data:')
    console.log('  timeRange:', timeRange)
    console.log('  effectiveTimeRange:', effectiveTimeRange)
    console.log('  dataLength:', data.length)
    console.log('  metric:', metric)
    console.log('  firstDataRow:', data[0])

    const agg = new Map<string, AggregatedPoint>()
    data.forEach((d) => {
      const key = periodKeyGetter(d)
      const prev = agg.get(key)
      const inc = metricGetter(d, metric)
      if (!prev) {
        agg.set(key, {
          label: periodLabelGetter(d),
          sortValue: periodSortGetter(d),
          value: inc,
          periodCells: periodTable.cells(d),
        })
        return
      }
      prev.value += inc
    })

    const result = Array.from(agg.values()).sort((a, b) => a.sortValue - b.sortValue)
    console.log('[EmbeddableSection] Aggregated chart data:')
    console.log('  length:', result.length)
    console.log('  first3:', result.slice(0, 3))
    console.log('  last3:', result.slice(-3))

    return result
  }, [data, metric, periodKeyGetter, periodSortGetter, periodLabelGetter, periodTable, metricGetter, timeRange, effectiveTimeRange])

  const formatInt = useMemo(() => {
    return (n: number) => new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 }).format(n)
  }, [])

  // Get embed config to check for geographic aggregation constraints
  const config = useMemo(() => getEmbedConfig(slug, section), [slug, section])
  const shouldAggregateToArrondissement = useMemo(
    () => config?.type === "standard" && config.constraints?.geoAggregation === "arrondissement",
    [config]
  )

  const mapGeoLevel = shouldAggregateToArrondissement ? "arrondissement" : "municipality"
  const mapYearlyPeriods = config?.type === "standard" ? config.constraints?.availableYears : undefined
  const mapYearlyPathTemplate = mapYearlyPeriods
    ? getDataPath(`/data/${slug}/yearly/year_{year}.json`)
    : undefined

  return (
    <div className="p-4 min-h-screen">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {viewType === "chart" && (
        <div className="w-full">
          <FilterableChart data={chartData} />
        </div>
      )}

      {viewType === "table" && (
        <FilterableTable data={chartData} label={label} periodHeaders={periodTable.headers} />
      )}

      {viewType === "map" && (
        <MapSection
          data={data as UnknownRecord[]}
          getGeoCode={(d) => String(municipalityCodeGetter(d as TData))}
          getValue={(d) => metricGetter(d as TData, metric)}
          getPeriod={(d) => periodKeyGetter(d as TData)}
          showTimeSlider={false}
          tooltipLabel={title}
          formatValue={formatInt}
          showProvinceBoundaries={true}
          height={500}
          geoLevel={mapGeoLevel}
          yearlyDataPathTemplate={mapYearlyPathTemplate}
          yearlyPeriods={mapYearlyPeriods}
          showSearch={false}
        />
      )}

    </div>
  )
}
