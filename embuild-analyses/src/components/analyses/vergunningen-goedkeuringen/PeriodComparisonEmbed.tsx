"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterableChart } from "../shared/FilterableChart"
import { DumbbellChart } from "../shared/DumbbellChart"
import { ExportButtons } from "../shared/ExportButtons"
import { GeoFilterInline } from "../shared/GeoFilterInline"
import { PeriodComparisonSection, type PeriodComparisonRow } from "../shared/PeriodComparisonSection"
import { aggregateMunicipalityToArrondissement } from "@/lib/map-utils"
import { ARRONDISSEMENTS, PROVINCES, type RegionCode } from "@/lib/geo-utils"
import { normalizeNisCode } from "@/lib/nis-fusion-utils"
import { useJsonBundle } from "@/lib/use-json-bundle"

type DataRow = {
  y: number
  q?: number
  m: number | string
  ren: number
  dwell: number
  apt: number
  house: number
}

type PeriodComparisonSectionKey =
  | "renovatie-vergelijking"
  | "renovatie-vergelijking-aantallen"
  | "renovatie-vergelijking-percentage"
  | "nieuwbouw-vergelijking"
  | "nieuwbouw-vergelijking-aantallen"
  | "nieuwbouw-vergelijking-percentage"

const PERIOD1_LABEL = "2019 Q1 - 2021 Q4"
const PERIOD2_LABEL = "2022 Q4 - 2025 Q3"

const COMPARISON_CONFIG: Record<
  PeriodComparisonSectionKey,
  { title: string; metric: "ren" | "dwell"; view: "full" | "counts" | "percentage" }
> = {
  "renovatie-vergelijking": {
    title: "Renovatie - vergelijking 2019-2021 vs 2022-2025",
    metric: "ren",
    view: "full",
  },
  "renovatie-vergelijking-aantallen": {
    title: "Renovatie - vergelijking 2019-2021 vs 2022-2025 (aantallen)",
    metric: "ren",
    view: "counts",
  },
  "renovatie-vergelijking-percentage": {
    title: "Renovatie - vergelijking 2019-2021 vs 2022-2025 (% verandering)",
    metric: "ren",
    view: "percentage",
  },
  "nieuwbouw-vergelijking": {
    title: "Nieuwbouw - vergelijking 2019-2021 vs 2022-2025",
    metric: "dwell",
    view: "full",
  },
  "nieuwbouw-vergelijking-aantallen": {
    title: "Nieuwbouw - vergelijking 2019-2021 vs 2022-2025 (aantallen)",
    metric: "dwell",
    view: "counts",
  },
  "nieuwbouw-vergelijking-percentage": {
    title: "Nieuwbouw - vergelijking 2019-2021 vs 2022-2025 (% verandering)",
    metric: "dwell",
    view: "percentage",
  },
}

function normalizeQuarterlyData(data: DataRow[]): DataRow[] {
  const aggregatedQuarter = new Map<string, DataRow>()

  for (const row of data) {
    const normalizedCode = normalizeNisCode(row.m) || String(row.m).padStart(5, "0")
    const key = `${row.y}-${row.q}|${normalizedCode}`
    const existing = aggregatedQuarter.get(key)

    if (!existing) {
      aggregatedQuarter.set(key, {
        y: row.y,
        q: row.q,
        m: Number(normalizedCode),
        ren: Number(row.ren) || 0,
        dwell: Number(row.dwell) || 0,
        apt: Number(row.apt) || 0,
        house: Number(row.house) || 0,
      })
      continue
    }

    existing.ren += Number(row.ren) || 0
    existing.dwell += Number(row.dwell) || 0
    existing.apt += Number(row.apt) || 0
    existing.house += Number(row.house) || 0
  }

  return Array.from(aggregatedQuarter.values())
}

function calculatePeriodComparison(
  data: DataRow[],
  metric: "ren" | "dwell" | "apt" | "house"
): PeriodComparisonRow[] {
  const period1Data = data.filter((d) => d.y >= 2019 && d.y <= 2021)
  const period2Data = data.filter(
    (d) => (d.y === 2022 && d.q === 4) || d.y === 2023 || d.y === 2024 || (d.y === 2025 && (d.q || 0) <= 3)
  )

  const period1Agg = aggregateMunicipalityToArrondissement(
    period1Data,
    (d) => d.m,
    (d) => Number(d[metric]) || 0
  )

  const period2Agg = aggregateMunicipalityToArrondissement(
    period2Data,
    (d) => d.m,
    (d) => Number(d[metric]) || 0
  )

  const period1Map = new Map(period1Agg.map((a) => [a.arrondissementCode, a.value]))
  const period2Map = new Map(period2Agg.map((a) => [a.arrondissementCode, a.value]))

  const allArrCodes = ARRONDISSEMENTS.map((arr) => arr.code)
  const comparisonRows: PeriodComparisonRow[] = []

  for (const arrCode of allArrCodes) {
    const p1 = period1Map.get(arrCode) || 0
    const p2 = period2Map.get(arrCode) || 0

    if (p1 === 0 && p2 === 0) continue

    const verschil = p2 - p1
    const percentageChange = p1 === 0 ? (p2 > 0 ? Infinity : 0) : (verschil / p1) * 100
    const arrondissement = ARRONDISSEMENTS.find((arr) => arr.code === arrCode)

    comparisonRows.push({
      arrondissementCode: arrCode,
      arrondissementName: arrondissement?.name || arrCode,
      period1: p1,
      period2: p2,
      verschil,
      percentageChange: Number.isFinite(percentageChange) ? percentageChange : 0,
    })
  }

  return comparisonRows.sort((a, b) => a.arrondissementName.localeCompare(b.arrondissementName, "nl-BE"))
}

interface PeriodComparisonEmbedProps {
  section: PeriodComparisonSectionKey
}

export function PeriodComparisonEmbed({ section }: PeriodComparisonEmbedProps) {
  const config = COMPARISON_CONFIG[section]

  const { data: bundle, loading, error } = useJsonBundle<{
    quarterly: DataRow[]
  }>({
    quarterly: "/analyses/vergunningen-goedkeuringen/results/data_quarterly.json",
  })

  const quarterlyRows = bundle?.quarterly as DataRow[] | undefined
  const normalizedQuarterly = useMemo(
    () => normalizeQuarterlyData(quarterlyRows ?? []),
    [quarterlyRows]
  )

  const [selectedRegion, setSelectedRegion] = useState<RegionCode>("2000")

  const comparisonData = useMemo(
    () => calculatePeriodComparison(normalizedQuarterly, config.metric),
    [normalizedQuarterly, config.metric]
  )

  const filteredData = useMemo(() => {
    if (selectedRegion === "1000") return comparisonData
    const provinceByArrondissement = new Map(ARRONDISSEMENTS.map((arr) => [arr.code, arr.provinceCode]))
    const regionByProvince = new Map(PROVINCES.map((prov) => [prov.code, prov.regionCode]))
    return comparisonData.filter((row) => {
      const provinceCode = provinceByArrondissement.get(row.arrondissementCode)
      if (!provinceCode) return false
      return regionByProvince.get(provinceCode) === selectedRegion
    })
  }, [comparisonData, selectedRegion])

  const countsChartData = useMemo(() => {
    return filteredData
      .map((row) => ({
        name: row.arrondissementName.replace("Arrondissement ", ""),
        period1: row.period1,
        period2: row.period2,
      }))
      .sort((a, b) => {
        const diff = a.period1 - b.period1
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name, "nl-BE")
      })
  }, [filteredData])

  const percentageChartData = useMemo(() => {
    return filteredData
      .map((row) => ({
        name: row.arrondissementName.replace("Arrondissement ", ""),
        percentageChange: Number.isFinite(row.percentageChange) ? row.percentageChange : 0,
      }))
      .sort((a, b) => {
        const diff = b.percentageChange - a.percentageChange
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name, "nl-BE")
      })
  }, [filteredData])

  const exportData = useMemo(() => {
    return filteredData.map((row) => ({
      label: row.arrondissementName,
      value: config.view === "percentage" ? row.percentageChange : row.period2,
      period1: row.period1,
      period2: row.period2,
      verschil: row.verschil,
      percentageChange: row.percentageChange,
    }))
  }, [filteredData, config.view])

  if (loading) {
    return <div className="p-4">Data laden...</div>
  }

  if (error || !bundle) {
    return (
      <div className="p-4 text-sm text-destructive">
        Fout bij het laden van data: {error ?? "Onbekende fout"}
      </div>
    )
  }

  if (config.view !== "full") {
    const chartTitle =
      config.view === "counts"
        ? "Periodevergelijking per arrondissement"
        : "Percentage verandering per arrondissement"
    const valueLabel = config.view === "counts" ? "Aantal" : "% Verandering"

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold">{config.title}</h3>
          <div className="flex items-center gap-2">
            <GeoFilterInline
              selectedRegion={selectedRegion}
              selectedProvince={null}
              onSelectRegion={setSelectedRegion}
              onSelectProvince={() => {}}
              showRegions={true}
              showProvinces={false}
            />
            <ExportButtons
              data={exportData}
              title={config.title}
              slug="vergunningen-goedkeuringen"
              sectionId={section}
              viewType="chart"
              periodHeaders={["Arrondissement"]}
              valueLabel={valueLabel}
              dataSource="Statbel - Bouwvergunningen"
              dataSourceUrl="https://statbel.fgov.be/nl/themas/bouwen-wonen/bouwvergunningen"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{chartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {config.view === "counts" ? (
              <DumbbellChart
                data={countsChartData}
                period1Label={PERIOD1_LABEL}
                period2Label={PERIOD2_LABEL}
                xAxisLabelAbove="Aantal"
              />
            ) : (
              <FilterableChart
                data={percentageChartData}
                getLabel={(d) => d.name}
                getValue={(d) => d.percentageChange}
                chartType="bar"
                layout="horizontal"
                yAxisLabelAbove="% Verandering"
                showMovingAverage={false}
              />
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // For "full" view, we need to strip the "-vergelijking" suffix
  // so the PeriodComparisonSection can append "-aantallen" and "-percentage"
  // Example: "renovatie-vergelijking" becomes "renovatie"
  // which then generates "renovatie-vergelijking-aantallen" and "renovatie-vergelijking-percentage"
  const baseSectionId = section.replace("-vergelijking", "")

  return (
    <PeriodComparisonSection
      title={config.title}
      data={comparisonData}
      metric={config.metric}
      slug="vergunningen-goedkeuringen"
      sectionId={`${baseSectionId}-vergelijking`}
      period1Label={PERIOD1_LABEL}
      period2Label={PERIOD2_LABEL}
      mapColorScheme="orangeDecile"
      mapColorScaleMode="negative"
      mapNeutralFill="#ffffff"
    />
  )
}
