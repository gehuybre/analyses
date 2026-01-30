"use client"

import React, { useMemo, useState, useEffect, useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ExportButtons } from "../shared/ExportButtons"
import { formatCurrency } from "@/lib/number-formatters"
import { getMunicipalityName } from "./nisUtils"
import { stripPrefix } from "./labelUtils"
import { getPublicPath } from "@/lib/path-utils"
import { SimpleGeoFilter } from "./SimpleGeoFilter"
import { SimpleGeoContext } from "../shared/GeoContext"

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

// Runtime validation helpers
function validateLookups(data: unknown): BVLookups {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid lookups: expected object')
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.domains) || !Array.isArray(obj.subdomeins) ||
    !Array.isArray(obj.beleidsvelds) || typeof obj.municipalities !== 'object') {
    throw new Error('Invalid lookups: missing or invalid fields')
  }
  return obj as unknown as BVLookups
}

function validateChunkData(data: unknown): BVRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Invalid chunk data: expected array')
  }
  return data as BVRecord[]
}

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



export function InvesteringenBVCategorySection() {
  const [lookups, setLookups] = useState<BVLookups | null>(null)
  const [muniData, setMuniData] = useState<BVRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedChunks, setLoadedChunks] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [geoSelection, setGeoSelection] = useState<{
    type: 'all' | 'region' | 'province' | 'arrondissement' | 'municipality'
    code?: string
  }>({ type: 'all' })
  const [selectedMetric, setSelectedMetric] = useState<'Totaal' | 'Per_inwoner'>('Totaal')
  const [selectedYear, setSelectedYear] = useState<number>(2026)

  // Load initial data and start chunk loading
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Reset data to prevent double-loading on remount
        setMuniData([])
        setLoadedChunks(0)

        const [metaRes, lookupsRes] = await Promise.all([
          fetch(getPublicPath('/data/gemeentelijke-investeringen/metadata.json')),
          fetch(getPublicPath('/data/gemeentelijke-investeringen/bv_lookups.json')),
        ])

        if (cancelled) return

        if (!metaRes.ok) throw new Error(`Failed to load metadata: ${metaRes.statusText}`)
        if (!lookupsRes.ok) throw new Error(`Failed to load lookups: ${lookupsRes.statusText}`)

        const meta = validateMetadata(await metaRes.json())
        const lookupsData = validateLookups(await lookupsRes.json())

        if (cancelled) return

        setLookups(lookupsData)
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

  // Get available municipalities for the selected year
  const availableMunicipalities = useMemo(() => {
    const nisCodesSet = new Set(
      muniData
        .filter(d => d.Rapportjaar === selectedYear)
        .map(d => d.NIS_code)
    )
    return Array.from(nisCodesSet)
  }, [muniData, selectedYear])

  // Category breakdown: Top 9 + Other
  const categoryData = useMemo(() => {
    if (!lookups || muniData.length === 0) return []

    // Filter by year and municipality
    let filteredData = muniData.filter(d => d.Rapportjaar === selectedYear)
    if (geoSelection.type === 'municipality' && geoSelection.code) {
      filteredData = filteredData.filter(d => d.NIS_code === geoSelection.code)
    }

    // Aggregate by Beleidsveld (highest detail level)
    const byCategory: Record<string, { label: string; value: number; count: number }> = {}

    filteredData.forEach(record => {
      const category = stripPrefix(record.Beleidsveld)
      if (!byCategory[category]) {
        byCategory[category] = { label: category, value: 0, count: 0 }
      }
      byCategory[category].value += record[selectedMetric]
      byCategory[category].count += 1
    })

    // For Per_inwoner metric, calculate average across municipalities (not sum)
    // Why: Per_inwoner values are already normalized per municipality population.
    // Summing them would be meaningless - we need the average to show typical spending.
    if (selectedMetric === 'Per_inwoner') {
      Object.values(byCategory).forEach(cat => {
        if (cat.count > 0) {
          cat.value = cat.value / cat.count
        }
      })
    }

    // Sort by value descending
    const sorted = Object.values(byCategory).sort((a, b) => b.value - a.value)

    // Top 9 + Other
    const top9 = sorted.slice(0, 9)
    const other = sorted.slice(9)

    const result = [...top9]
    if (other.length > 0) {
      const otherSum = other.reduce((sum, item) => sum + item.value, 0)
      const otherCount = other.reduce((sum, item) => sum + item.count, 0)
      result.push({ label: 'Overige', value: otherSum, count: otherCount })
    }

    return result
  }, [lookups, muniData, selectedYear, geoSelection, selectedMetric])

  // Calculate max value across ALL years for consistent bar chart scaling
  const maxValue = useMemo(() => {
    if (!lookups || muniData.length === 0) return 1

    const years = [2014, 2020, 2026]
    let globalMax = 1

    years.forEach(year => {
      // Filter by year and municipality (same logic as categoryData)
      let filteredData = muniData.filter(d => d.Rapportjaar === year)
      if (geoSelection.type === 'municipality' && geoSelection.code) {
        filteredData = filteredData.filter(d => d.NIS_code === geoSelection.code)
      }

      // Aggregate by Beleidsveld
      const byCategory: Record<string, { value: number; count: number }> = {}
      filteredData.forEach(record => {
        const category = stripPrefix(record.Beleidsveld)
        if (!byCategory[category]) {
          byCategory[category] = { value: 0, count: 0 }
        }
        byCategory[category].value += record[selectedMetric]
        byCategory[category].count += 1
      })

      // For Per_inwoner, calculate average
      if (selectedMetric === 'Per_inwoner') {
        Object.values(byCategory).forEach(cat => {
          if (cat.count > 0) {
            cat.value = cat.value / cat.count
          }
        })
      }

      // Get top 9 + other
      const sorted = Object.values(byCategory).map(c => c.value).sort((a, b) => b - a)
      const top9 = sorted.slice(0, 9)
      const other = sorted.slice(9)
      const values = [...top9]
      if (other.length > 0) {
        values.push(other.reduce((sum, val) => sum + val, 0))
      }

      const yearMax = Math.max(...values, 1)
      globalMax = Math.max(globalMax, yearMax)
    })

    return globalMax
  }, [lookups, muniData, geoSelection, selectedMetric])

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
          <p className="text-sm text-muted-foreground italic">Laden van BV-categorieën...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <SimpleGeoContext.Provider value={{ selection: geoSelection, setSelection: setGeoSelection }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verdeling per beleidsveld (BV)</CardTitle>
            <div className="flex items-center gap-4">
              {loadedChunks < totalChunks && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Laden data: {Math.round((loadedChunks / totalChunks) * 100)}%
                </div>
              )}
              <ExportButtons
                title="Verdeling per beleidsveld"
                slug="gemeentelijke-investeringen"
                sectionId="bv-category-breakdown"
                viewType="table"
                data={categoryData.map(d => ({ label: d.label, value: d.value }))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Top 9 beleidsvel den met hoogste investeringen + overige categorieën.
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
              <div className="flex gap-2">
                <Button
                  variant={selectedYear === 2014 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(2014)}
                  className="h-9"
                >
                  2014
                </Button>
                <Button
                  variant={selectedYear === 2020 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(2020)}
                  className="h-9"
                >
                  2020
                </Button>
                <Button
                  variant={selectedYear === 2026 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(2026)}
                  className="h-9"
                >
                  2026
                </Button>
              </div>
              <SimpleGeoFilter
                availableMunicipalities={availableMunicipalities}
                municipalityLookup={lookups?.municipalities}
              />
            </div>

            {/* Category breakdown */}
            <div className="space-y-4">
              {categoryData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic">
                  Geen data beschikbaar voor deze selectie.
                </div>
              ) : (
                categoryData.map((item, index) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {index + 1}. {item.label}
                      </span>
                      <span className="font-bold text-sm">
                        {selectedMetric === 'Totaal'
                          ? formatCurrency(item.value)
                          : `€ ${item.value.toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.label === 'Overige' ? "bg-gray-400" : "bg-blue-500"
                        )}
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              {geoSelection.type === 'municipality' && geoSelection.code
                ? `Investeringen voor ${getMunicipalityName(geoSelection.code, lookups?.municipalities)} in ${selectedYear}`
                : `Totale investeringen over alle gemeenten in ${selectedYear}`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </SimpleGeoContext.Provider>
  )
}
