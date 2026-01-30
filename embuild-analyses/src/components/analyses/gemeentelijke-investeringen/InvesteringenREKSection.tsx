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

interface REKLookups {
  niveau3s: Array<{ Niveau_3: string }>
  alg_rekenings: Array<{ Niveau_3: string; Alg_rekening: string }>
  municipalities: Record<string, string>
}

interface REKRecord {
  NIS_code: string
  Rapportjaar: number
  Niveau_3: string
  Alg_rekening: string
  Totaal: number
  Per_inwoner: number
}

interface REKVlaanderenRecord {
  Rapportjaar: number
  Niveau_3: string
  Alg_rekening: string
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

function validateLookups(data: unknown): REKLookups {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid lookups: expected object')
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.niveau3s) || !Array.isArray(obj.alg_rekenings) ||
    !obj.municipalities || typeof obj.municipalities !== 'object') {
    throw new Error('Invalid lookups: missing or invalid fields')
  }
  // More explicit structure validation
  return {
    niveau3s: obj.niveau3s as Array<{ Niveau_3: string }>,
    alg_rekenings: obj.alg_rekenings as Array<{ Niveau_3: string; Alg_rekening: string }>,
    municipalities: obj.municipalities as Record<string, string>
  }
}

function validateVlaanderenData(data: unknown): REKVlaanderenRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid Vlaanderen data: expected array')
  }
  return data as REKVlaanderenRecord[]
}

function validateChunkData(data: unknown): REKRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid chunk data: expected array')
  }
  return data as REKRecord[]
}

export function InvesteringenREKSection() {
  const [lookups, setLookups] = useState<REKLookups | null>(null)
  const [vlaanderenData, setVlaanderenData] = useState<REKVlaanderenRecord[]>([])
  const [muniData, setMuniData] = useState<REKRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedChunks, setLoadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [selectedNiveau3, setSelectedNiveau3] = useState<string>('')
  const [selectedAlgRekening, setSelectedAlgRekening] = useState<string>('')
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
          fetch(getPublicPath('/data/gemeentelijke-investeringen/rek_lookups.json')),
          fetch(getPublicPath('/data/gemeentelijke-investeringen/rek_vlaanderen_data.json'))
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
        setTotalChunks(meta.rek_chunks)

        setIsLoading(false)

        // Load chunks sequentially
        const allChunks: REKRecord[] = []
        for (let i = 0; i < meta.rek_chunks; i++) {
          if (cancelled) return

          const chunkRes = await fetch(getPublicPath(`/data/gemeentelijke-investeringen/rek_municipality_data_chunk_${i}.json`))
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
          console.error('Failed to load REK data:', err)
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
  const niveau3Options = useMemo(() => {
    if (!lookups) return []
    return lookups.niveau3s.map(n => stripPrefix(n.Niveau_3)).sort()
  }, [lookups])

  const algRekeningOptions = useMemo(() => {
    if (!lookups) return []
    let options = lookups.alg_rekenings
    if (selectedNiveau3) {
      // Match by stripped prefix
      options = options.filter(a => stripPrefix(a.Niveau_3) === selectedNiveau3)
    }
    return options.map(a => stripPrefix(a.Alg_rekening)).sort()
  }, [lookups, selectedNiveau3])

  // Filter data based on REK selections (without geo filter)
  // Match by stripped labels since user sees stripped versions
  const dataWithoutGeoFilter = useMemo(() => {
    let data = muniData

    if (selectedNiveau3) {
      data = data.filter(d => stripPrefix(d.Niveau_3) === selectedNiveau3)
    }
    if (selectedAlgRekening) {
      data = data.filter(d => stripPrefix(d.Alg_rekening) === selectedAlgRekening)
    }

    return data
  }, [muniData, selectedNiveau3, selectedAlgRekening])

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
    } else if (geoSelection.type === 'province' && geoSelection.code) {
      // Filter by province (first digit match for 1,3,4,7 or first 2 for 21/23/24/25 etc)
      // Simplistic implementation - assumes province code is passed correctly
      // But for "Heel Vlaanderen" (type: all), we want to filter out Wallonia/Brussels
    } else if (geoSelection.type === 'all' || (geoSelection.type === 'region' && geoSelection.code === '2000')) {
      // Default to Flanders View for this dashboard
      // Keep only: 1xxxx (Antwerp), 3xxxx (West-Fl), 4xxxx (East-Fl), 7xxxx (Limburg), 23xxx/24xxx (Fl-Brabant)
      data = data.filter(d => {
        const code = String(d.NIS_code)
        const first = code.charAt(0)
        const two = code.substring(0, 2)
        // Keep if starts with 1, 3, 4, 7 OR (starts with 2 and is 23 or 24)
        return ['1', '3', '4', '7'].includes(first) || ['23', '24'].includes(two)
      })
    }

    return data
  }, [dataWithoutGeoFilter, geoSelection])

  // Chart data: Vlaanderen totals or municipality average
  const chartData = useMemo(() => {
    const byYear: Record<number, { Rapportjaar: number; value: number }> = {}

    if (geoSelection.type === 'all') {
      // For "all" view with filters, aggregate per municipality first to avoid double counting.
      // Why: A single municipality can have multiple records (one per Niveau_3/Alg_rekening).
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
        // No need to filter by normalized code explicitly here because filteredData
        // is already filtered by the user's selection.
        // However, if we want to show the timeline for a merged municipality,
        // we should conceptually treat this record as belonging to the merged entity.
        // But the chart simply sums everything in filteredData.
        // So if I selected "Pajottegem", filteredData should ideally include Galmaarden data?
        // Wait, filteredData filtering logic (lines 218) uses strict equality: d.NIS_code === geoSelection.code.
        // If I select Pajottegem (23106), I won't get Galmaarden (23023) data!
        // I need to fix the FILTERING logic first to include constituent codes.

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
    // We normalize codes here too, so the user sees "Pajottegem" in the filter,
    // and selecting it selects the normalized entity
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
          <p className="text-sm text-muted-foreground italic">Laden van investeringen per economische rekening...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <SimpleGeoContext.Provider value={{ selection: geoSelection, setSelection: setGeoSelection }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investeringen per economische rekening (REK)</CardTitle>
            <div className="flex items-center gap-4">
              {loadedChunks < totalChunks && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Laden data: {Math.round((loadedChunks / totalChunks) * 100)}%
                </div>
              )}
              <ExportButtons
                title="Investeringen per economische rekening"
                slug="gemeentelijke-investeringen"
                sectionId="investments-rek"
                viewType="table"
                data={tableData.map(d => ({ label: d.municipality, value: d.total }))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Filter op niveau 3 en algemene rekening om de investeringen per gemeente te bekijken.
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
                value={selectedNiveau3}
                onChange={(v) => {
                  setSelectedNiveau3(v)
                  setSelectedAlgRekening('')
                }}
                options={niveau3Options}
                placeholder="Selecteer niveau 3"
                minWidth={250}
              />
              {selectedNiveau3 && (
                <HierarchicalFilter
                  value={selectedAlgRekening}
                  onChange={setSelectedAlgRekening}
                  options={algRekeningOptions}
                  placeholder="Selecteer algemene rekening"
                  minWidth={250}
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
