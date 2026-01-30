"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MunicipalityMap } from "../shared/MunicipalityMap"
import { InvesteringenMap } from "./InvesteringenMap"
import { SimpleGeoFilter } from "./SimpleGeoFilter"
import { SimpleGeoContext } from "../shared/GeoContext"
import { ExportButtons } from "../shared/ExportButtons"
import { HierarchicalFilter } from "../shared/HierarchicalFilter"
import { getMunicipalityName } from "./nisUtils"
import { stripPrefix } from "./labelUtils"
import {
  createAutoScaledFormatter,
  createYAxisLabel,
  formatCurrency as formatFullCurrency,
} from "@/lib/number-formatters"
import { CHART_SERIES_COLORS } from "@/lib/chart-theme"
import { getPublicPath } from "@/lib/path-utils"
import { normalizeNisCode, getFusionInfo, getConstituents } from "@/lib/nis-fusion-utils"

interface BVLookups {
  domains: Array<{ BV_domein: string }>
  subdomeins: Array<{ BV_domein: string; BV_subdomein: string }>
  beleidsvelds: Array<{ BV_subdomein: string; Beleidsveld: string }>
  municipalities: Record<string, string>
}

interface BVRecord {
  NIS_code: string
  Rapportjaar: number
  BV_domein: string
  BV_subdomein: string
  Beleidsveld: string
  Totaal: number
  Per_inwoner: number
}

interface BVVlaanderenRecord {
  Rapportjaar: number
  BV_domein: string
  BV_subdomein: string
  Beleidsveld: string
  Totaal: number
  Per_inwoner: number
}



// Removed local formatters - using centralized formatters from @/lib/number-formatters

// Runtime validation helpers
function validateMetadata(data: unknown): { bv_chunks: number; rek_chunks: number } {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid metadata: expected object')
  }
  const obj = data as Record<string, unknown>
  if (typeof obj.bv_chunks !== 'number' || typeof obj.rek_chunks !== 'number') {
    throw new Error('Invalid metadata: missing or invalid chunk counts')
  }
  return obj as { bv_chunks: number; rek_chunks: number }
}

function validateLookups(data: unknown): BVLookups {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid lookups: expected object')
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.domains) || !Array.isArray(obj.subdomeins) ||
    !Array.isArray(obj.beleidsvelds) || !obj.municipalities || typeof obj.municipalities !== 'object') {
    throw new Error('Invalid lookups: missing or invalid fields')
  }
  // More explicit structure validation
  return {
    domains: obj.domains as Array<{ BV_domein: string }>,
    subdomeins: obj.subdomeins as Array<{ BV_domein: string; BV_subdomein: string }>,
    beleidsvelds: obj.beleidsvelds as Array<{ BV_subdomein: string; Beleidsveld: string }>,
    municipalities: obj.municipalities as Record<string, string>
  }
}

function validateVlaanderenData(data: unknown): BVVlaanderenRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid Vlaanderen data: expected array')
  }
  return data as BVVlaanderenRecord[]
}

function validateChunkData(data: unknown): BVRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid chunk data: expected array')
  }
  return data as BVRecord[]
}

export function InvesteringenBVSection() {
  const [lookups, setLookups] = useState<BVLookups | null>(null)
  const [vlaanderenData, setVlaanderenData] = useState<BVVlaanderenRecord[]>([])
  const [muniData, setMuniData] = useState<BVRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedChunks, setLoadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [selectedSubdomein, setSelectedSubdomein] = useState<string>('')
  const [selectedBeleidsveld, setSelectedBeleidsveld] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<'Totaal' | 'Per_inwoner'>('Totaal')
  const [geoSelection, setGeoSelection] = useState<{
    type: 'all' | 'region' | 'province' | 'arrondissement' | 'municipality'
    code?: string
  }>({ type: 'all' })

  // Load initial data and start chunk loading
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Reset data to prevent double-loading on remount
        setMuniData([])
        setLoadedChunks(0)

        const [metaRes, lookupsRes, vlaanderenRes] = await Promise.all([
          fetch(getPublicPath('/data/gemeentelijke-investeringen/metadata.json')),
          fetch(getPublicPath('/data/gemeentelijke-investeringen/bv_lookups.json')),
          fetch(getPublicPath('/data/gemeentelijke-investeringen/bv_vlaanderen_data.json'))
        ])

        if (cancelled) return

        if (!metaRes.ok) throw new Error(`Failed to load metadata: ${metaRes.statusText}`)
        if (!lookupsRes.ok) throw new Error(`Failed to load lookups: ${lookupsRes.statusText}`)
        if (!vlaanderenRes.ok) throw new Error(`Failed to load Vlaanderen data: ${vlaanderenRes.statusText}`)

        const meta = validateMetadata(await metaRes.json())
        const lookupsData = validateLookups(await lookupsRes.json())
        const vlaanderen = validateVlaanderenData(await vlaanderenRes.json())

        if (cancelled) return

        setLookups(lookupsData)
        setVlaanderenData(vlaanderen)
        setTotalChunks(meta.bv_chunks)

        setIsLoading(false)

        // Load chunks sequentially
        const allChunks: BVRecord[] = []
        for (let i = 0; i < meta.bv_chunks; i++) {
          if (cancelled) return

          const chunkRes = await fetch(getPublicPath(`/data/gemeentelijke-investeringen/bv_municipality_data_chunk_${i}.json`))
          if (!chunkRes.ok) {
            throw new Error(`Failed to load chunk ${i}: ${chunkRes.statusText}`)
          }
          const chunkData = validateChunkData(await chunkRes.json())
          allChunks.push(...chunkData)
          setMuniData([...allChunks])
          setLoadedChunks(i + 1)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load BV data:', err)
          setError(err instanceof Error ? err.message : 'Fout bij het laden van de data')
          setIsLoading(false)
        }
      }
    }
    init()

    return () => {
      cancelled = true
    }
  }, [])

  // Get available options based on selections (with prefixes stripped)
  const domainOptions = useMemo(() => {
    if (!lookups) return []
    return lookups.domains.map(d => stripPrefix(d.BV_domein)).sort()
  }, [lookups])

  const subdomeinOptions = useMemo(() => {
    if (!lookups) return []
    let options = lookups.subdomeins
    if (selectedDomain) {
      // Match by stripped prefix
      options = options.filter(s => stripPrefix(s.BV_domein) === selectedDomain)
    }
    return options.map(s => stripPrefix(s.BV_subdomein)).sort()
  }, [lookups, selectedDomain])

  const beleidsveldOptions = useMemo(() => {
    if (!lookups) return []
    let options = lookups.beleidsvelds
    if (selectedSubdomein) {
      // Match by stripped prefix
      options = options.filter(b => stripPrefix(b.BV_subdomein) === selectedSubdomein)
    }
    return options.map(b => stripPrefix(b.Beleidsveld)).sort()
  }, [lookups, selectedSubdomein])

  // Filter data based on BV selections (without geo filter)
  // Match by stripped labels since user sees stripped versions
  const dataWithoutGeoFilter = useMemo(() => {
    let data = muniData

    if (selectedDomain) {
      data = data.filter(d => stripPrefix(d.BV_domein) === selectedDomain)
    }
    if (selectedSubdomein) {
      data = data.filter(d => stripPrefix(d.BV_subdomein) === selectedSubdomein)
    }
    if (selectedBeleidsveld) {
      data = data.filter(d => stripPrefix(d.Beleidsveld) === selectedBeleidsveld)
    }

    return data
  }, [muniData, selectedDomain, selectedSubdomein, selectedBeleidsveld])

  // Filter data based on selections (including geo filter)
  const filteredData = useMemo(() => {
    let data = dataWithoutGeoFilter

    // Apply geo filter
    if (geoSelection.type === 'municipality' && geoSelection.code) {
      // Get constituent codes if this is a merged municipality
      const constituents = getConstituents(geoSelection.code)

      // Build list of codes to match (new code + all old constituent codes)
      const codesToMatch = constituents.length > 0
        ? [geoSelection.code, ...constituents]
        : [geoSelection.code]

      data = data.filter(d => {
        // Normalize the record's code
        const normalizedCode = normalizeNisCode(d.NIS_code) || d.NIS_code

        // Match if either the normalized code OR the original code is in our list
        return codesToMatch.includes(normalizedCode) || codesToMatch.includes(d.NIS_code)
      })
    }

    return data
  }, [dataWithoutGeoFilter, geoSelection])

  // Chart data: Vlaanderen totals or municipality average
  const chartData = useMemo(() => {
    const byYear: Record<number, { Rapportjaar: number; value: number }> = {}

    if (geoSelection.type === 'all') {
      // For "all" view with filters, aggregate per municipality first to avoid double counting.
      // Why: A single municipality can have multiple records (one per domain/subdomein/beleidsveld).
      // If we sum directly, we'd count municipality data multiple times per year.
      // Instead, we first aggregate per municipality+year, then sum across municipalities.
      const perMuniYear: Record<string, number> = {}

      dataWithoutGeoFilter.forEach(record => {
        const normalizedCode = normalizeNisCode(record.NIS_code) || record.NIS_code
        const key = `${normalizedCode}_${record.Rapportjaar}`
        perMuniYear[key] = (perMuniYear[key] || 0) + record[selectedMetric]
      })

      // Then aggregate across municipalities
      Object.entries(perMuniYear).forEach(([key, value]) => {
        const year = parseInt(key.split('_')[1])
        if (!byYear[year]) {
          byYear[year] = { Rapportjaar: year, value: 0 }
        }
        byYear[year].value += value
      })

      // For Per_inwoner metric, calculate average across municipalities (not sum)
      // Why: Per_inwoner values are already normalized per municipality population.
      // Summing them would be meaningless - we need the average to show typical spending.
      if (selectedMetric === 'Per_inwoner') {
        const municipalityCounts: Record<number, Set<string>> = {}
        dataWithoutGeoFilter.forEach(record => {
          if (!municipalityCounts[record.Rapportjaar]) {
            municipalityCounts[record.Rapportjaar] = new Set()
          }
          const normalizedCode = normalizeNisCode(record.NIS_code) || record.NIS_code
          municipalityCounts[record.Rapportjaar].add(normalizedCode)
        })
        Object.keys(byYear).forEach(year => {
          const y = parseInt(year)
          const count = municipalityCounts[y]?.size || 0
          if (count > 0) {
            byYear[y].value = byYear[y].value / count
          }
        })
      }
    } else {
      // For specific region/province/municipality selection, sum all matching records.
      // This is safe because filteredData already contains only records for that selection.
      filteredData.forEach(record => {
        if (!byYear[record.Rapportjaar]) {
          byYear[record.Rapportjaar] = { Rapportjaar: record.Rapportjaar, value: 0 }
        }
        byYear[record.Rapportjaar].value += record[selectedMetric]
      })
    }

    return Object.values(byYear).sort((a, b) => a.Rapportjaar - b.Rapportjaar)
  }, [filteredData, selectedMetric, geoSelection])

  // Auto-scale formatter for Y-axis to prevent label overflow
  const { formatter: yAxisFormatter, scaleLabel: yAxisScaleLabel } = useMemo(() => {
    const values = chartData.map(d => d.value)
    return createAutoScaledFormatter(values, true) // true = currency
  }, [chartData])

  // Y-axis label
  const yAxisLabel = useMemo(() => {
    const baseLabel = selectedMetric === 'Totaal' ? 'Totale uitgave' : 'Uitgave per inwoner'
    return createYAxisLabel(baseLabel, yAxisScaleLabel, true)
  }, [selectedMetric, yAxisScaleLabel])

  // Table data: By municipality with context window for selected municipality
  const tableData = useMemo(() => {
    const byMuni: Record<string, { municipality: string; total: number; count: number; nisCode: string }> = {}

    // Use dataWithoutGeoFilter to get all municipalities for ranking
    dataWithoutGeoFilter.forEach(record => {
      // Show latest year for table
      if (record.Rapportjaar !== 2026) return

      const normalizedCode = normalizeNisCode(record.NIS_code) || record.NIS_code

      if (!byMuni[normalizedCode]) {
        // Use fusion info for name if available
        const fusion = getFusionInfo(normalizedCode)
        const name = fusion ? fusion.newName : getMunicipalityName(normalizedCode, lookups?.municipalities)

        byMuni[normalizedCode] = {
          municipality: name,
          total: 0,
          count: 0,
          nisCode: normalizedCode
        }
      }
      byMuni[normalizedCode].total += record[selectedMetric]
      byMuni[normalizedCode].count += 1
    })

    // Sort all municipalities by total (high to low) and assign ranks
    const allMunicipalities = Object.values(byMuni)
      .sort((a, b) => b.total - a.total)
      .map((m, index) => ({ ...m, rank: index + 1 }))

    // If a specific municipality is selected, show it with 19 others around it
    if (geoSelection.type === 'municipality' && geoSelection.code) {
      const selectedIndex = allMunicipalities.findIndex(
        m => m.nisCode === geoSelection.code
      )

      if (selectedIndex !== -1) {
        // Calculate window: show selected + 9 above + 10 below (or adjust if at edges)
        const windowSize = 20
        const halfWindow = 9 // municipalities above selected

        let startIndex = Math.max(0, selectedIndex - halfWindow)
        let endIndex = startIndex + windowSize

        // Adjust if we're near the end
        if (endIndex > allMunicipalities.length) {
          endIndex = allMunicipalities.length
          startIndex = Math.max(0, endIndex - windowSize)
        }

        return allMunicipalities.slice(startIndex, endIndex)
      }
    }

    // Default: show top 20 municipalities
    return allMunicipalities.slice(0, 20)
  }, [dataWithoutGeoFilter, selectedMetric, geoSelection])

  // Map data: Latest rapportjaar (2026)
  const mapData = useMemo(() => {
    const latestYear = 2026
    const byMuni: Record<string, { municipalityCode: string; value: number }> = {}

    filteredData
      .filter(d => d.Rapportjaar === latestYear)
      .forEach(record => {
        // Normalize NIS code to handle 2025 mergers
        const normalizedCode = normalizeNisCode(record.NIS_code)
        if (!normalizedCode) return

        if (!byMuni[normalizedCode]) {
          // If fusion, use the new name
          const fusion = getFusionInfo(normalizedCode)
          const name = fusion ? fusion.newName : getMunicipalityName(normalizedCode, lookups?.municipalities)

          byMuni[normalizedCode] = { municipalityCode: normalizedCode, value: 0 }
        }
        byMuni[normalizedCode].value += record[selectedMetric]
      })

    return Object.values(byMuni)
  }, [filteredData, selectedMetric])

  // Get available municipalities from the filtered data (without geo filter)
  const availableMunicipalities = useMemo(() => {
    // We normalize codes here too, so the user sees merged municipality names in the filter
    const normalizedSet = new Set<string>()
    dataWithoutGeoFilter.forEach(d => {
      const c = normalizeNisCode(d.NIS_code)
      if (c) normalizedSet.add(c)
    })
    return Array.from(normalizedSet)
  }, [dataWithoutGeoFilter])

  if (error) {
    return (
      <Card>
        <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-destructive font-medium">Fout bij het laden van de data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} size="sm">
            Opnieuw proberen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !lookups) {
    return (
      <Card>
        <CardContent className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground italic">Laden van investeringen per beleidsdomein...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <SimpleGeoContext.Provider value={{ selection: geoSelection, setSelection: setGeoSelection }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investeringen per beleidsdomein (BV)</CardTitle>
            <div className="flex items-center gap-4">
              {loadedChunks < totalChunks && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Laden data: {Math.round((loadedChunks / totalChunks) * 100)}%
                </div>
              )}
              <ExportButtons
                title="Investeringen per beleidsdomein"
                slug="gemeentelijke-investeringen"
                sectionId="investments-bv"
                viewType="table"
                data={tableData.map(d => ({ label: d.municipality, value: d.total }))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Filter op domein, subdomein en beleidsveld om de investeringen per gemeente te bekijken.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Button
                  variant={selectedMetric === 'Totaal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('Totaal')}
                  className="h-9"
                >
                  Totaal
                </Button>
                <Button
                  variant={selectedMetric === 'Per_inwoner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('Per_inwoner')}
                  className="h-9"
                >
                  Per inwoner
                </Button>
              </div>
              <SimpleGeoFilter
                availableMunicipalities={availableMunicipalities}
                municipalityLookup={lookups?.municipalities}
              />
              <HierarchicalFilter
                value={selectedDomain}
                onChange={(v) => {
                  setSelectedDomain(v)
                  setSelectedSubdomein('')
                  setSelectedBeleidsveld('')
                }}
                options={domainOptions}
                placeholder="Selecteer domein"
              />
              {selectedDomain && (
                <HierarchicalFilter
                  value={selectedSubdomein}
                  onChange={(v) => {
                    setSelectedSubdomein(v)
                    setSelectedBeleidsveld('')
                  }}
                  options={subdomeinOptions}
                  placeholder="Selecteer subdomein"
                />
              )}
              {selectedSubdomein && (
                <HierarchicalFilter
                  value={selectedBeleidsveld}
                  onChange={setSelectedBeleidsveld}
                  options={beleidsveldOptions}
                  placeholder="Selecteer beleidsveld"
                />
              )}
            </div>

            <Tabs defaultValue="chart" className="w-full">
              <TabsList>
                <TabsTrigger value="chart">Grafiek</TabsTrigger>
                <TabsTrigger value="table">Tabel</TabsTrigger>
                <TabsTrigger value="map">Kaart</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="mt-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium ml-16">
                    {yAxisLabel.text}
                    <span className="font-bold">
                      {yAxisLabel.boldText}
                    </span>
                  </div>
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Rapportjaar" />
                        <YAxis
                          tickFormatter={yAxisFormatter}
                        />
                        <Tooltip
                          formatter={(value) => {
                            if (typeof value !== 'number') return ''
                            return selectedMetric === 'Totaal' ? formatFullCurrency(value) : `€ ${value.toFixed(2)}`
                          }}
                          labelFormatter={(label) => `Rapportjaar ${label}`}
                        />
                        <Bar dataKey="value" fill={CHART_SERIES_COLORS[0]} name={selectedMetric === 'Totaal' ? 'Totaal' : 'Gemiddelde per inwoner'} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {geoSelection.type === 'all'
                    ? selectedMetric === 'Totaal'
                      ? 'Som van alle gemeenten'
                      : 'Gemiddelde over alle gemeenten'
                    : 'Geselecteerde regio/provincie/gemeente'
                  }
                </p>
              </TabsContent>

              <TabsContent value="table" className="mt-4">
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium w-16">Rank</th>
                        <th className="p-2 text-left font-medium">Gemeente</th>
                        <th className="p-2 text-right font-medium">
                          {selectedMetric === 'Totaal' ? 'Totaal' : 'Per inwoner'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground italic">
                            Data aan het laden...
                          </td>
                        </tr>
                      ) : (
                        tableData.map((row, i) => {
                          const isSelected = geoSelection.type === 'municipality' && geoSelection.code === row.nisCode
                          return (
                            <tr key={i} className={`border-b ${isSelected ? 'bg-primary/10 font-semibold' : ''}`}>
                              <td className="p-2 text-center text-muted-foreground">{row.rank}</td>
                              <td className="p-2">{row.municipality}</td>
                              <td className="p-2 text-right">
                                {selectedMetric === 'Totaal'
                                  ? formatFullCurrency(row.total)
                                  : `€ ${row.total.toFixed(2)}`
                                }
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {geoSelection.type === 'municipality' && geoSelection.code
                    ? 'Top 20 gemeenten (inclusief geselecteerde gemeente, rapportjaar 2026)'
                    : 'Top 20 gemeenten (rapportjaar 2026)'}
                </p>
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <InvesteringenMap
                  data={mapData.map(d => ({
                    value: d.value,
                    municipality: getMunicipalityName(d.municipalityCode, lookups?.municipalities),
                    nis_code: d.municipalityCode
                  }))}
                  selectedMetric={selectedMetric === 'Totaal' ? 'total' : 'per_capita'}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Rapportjaar 2026 - {selectedMetric === 'Totaal' ? 'Totale uitgave' : 'Uitgave per inwoner'}
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </SimpleGeoContext.Provider>
  )
}
