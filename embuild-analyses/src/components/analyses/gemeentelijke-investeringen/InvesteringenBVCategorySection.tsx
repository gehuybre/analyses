"use client"

import React, { useMemo, useState, useEffect, useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
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

  // State for expanded domains (to show subdomain info)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())

  // Category breakdown by domain with subdomein list
  interface DomainData {
    label: string
    value: number
    count: number
    subdomainLabels: string[]
  }

  const categoryData = useMemo(() => {
    if (!lookups || muniData.length === 0) return []

    // Filter by year and municipality
    let filteredData = muniData.filter(d => d.Rapportjaar === selectedYear)
    if (geoSelection.type === 'municipality' && geoSelection.code) {
      filteredData = filteredData.filter(d => d.NIS_code === geoSelection.code)
    }

    // Aggregate by BV_domein (domain level) and collect subdomain names
    const byDomain: Record<string, { label: string; value: number; count: number; subdomainSet: Set<string> }> = {}

    filteredData.forEach(record => {
      const domain = stripPrefix(record.BV_domein)
      const subdomain = stripPrefix(record.BV_subdomein)

      if (!byDomain[domain]) {
        byDomain[domain] = { label: domain, value: 0, count: 0, subdomainSet: new Set() }
      }

      byDomain[domain].value += record[selectedMetric]
      byDomain[domain].count += 1
      byDomain[domain].subdomainSet.add(subdomain)
    })

    // For Per_inwoner metric, calculate average across municipalities
    if (selectedMetric === 'Per_inwoner') {
      Object.values(byDomain).forEach(domain => {
        if (domain.count > 0) {
          domain.value = domain.value / domain.count
        }
      })
    }

    // Sort domains by value descending and format with subdomain list
    const sorted = Object.values(byDomain)
      .map(domain => ({
        label: domain.label,
        value: domain.value,
        count: domain.count,
        subdomainLabels: Array.from(domain.subdomainSet).sort()
      }))
      .sort((a, b) => b.value - a.value)

    return sorted as DomainData[]
  }, [lookups, muniData, selectedYear, geoSelection, selectedMetric])

  // Calculate max value across ALL years for consistent bar chart scaling
  const maxValue = useMemo(() => {
    if (!lookups || muniData.length === 0) return 1

    const years = [2014, 2020, 2026]
    let globalMax = 1

    years.forEach(year => {
      // Filter by year and municipality
      let filteredData = muniData.filter(d => d.Rapportjaar === year)
      if (geoSelection.type === 'municipality' && geoSelection.code) {
        filteredData = filteredData.filter(d => d.NIS_code === geoSelection.code)
      }

      // Aggregate by BV_domein
      const byDomain: Record<string, { value: number; count: number }> = {}
      filteredData.forEach(record => {
        const domain = stripPrefix(record.BV_domein)
        if (!byDomain[domain]) {
          byDomain[domain] = { value: 0, count: 0 }
        }
        byDomain[domain].value += record[selectedMetric]
        byDomain[domain].count += 1
      })

      // For Per_inwoner, calculate average
      if (selectedMetric === 'Per_inwoner') {
        Object.values(byDomain).forEach(domain => {
          if (domain.count > 0) {
            domain.value = domain.value / domain.count
          }
        })
      }

      // Get all domain values
      const values = Object.values(byDomain).map(d => d.value)
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
            <CardTitle>Verdeling per beleidsdomein (BV)</CardTitle>
            <div className="flex items-center gap-4">
              {loadedChunks < totalChunks && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Laden data: {Math.round((loadedChunks / totalChunks) * 100)}%
                </div>
              )}
              <ExportButtons
                title="Verdeling per beleidsdomein"
                slug="gemeentelijke-investeringen"
                sectionId="bv-category-breakdown"
                viewType="table"
                data={categoryData.map(d => ({ label: d.label, value: d.value }))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Investeringen per beleidsdomein. Klik op een domein om te zien welke subdomeinen het bevat.
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
            <div className="space-y-3">
              {categoryData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic">
                  Geen data beschikbaar voor deze selectie.
                </div>
              ) : (
                categoryData.map((domain, index) => {
                  const isExpanded = expandedDomains.has(domain.label)
                  const toggleExpand = () => {
                    const newExpanded = new Set(expandedDomains)
                    if (isExpanded) {
                      newExpanded.delete(domain.label)
                    } else {
                      newExpanded.add(domain.label)
                    }
                    setExpandedDomains(newExpanded)
                  }

                  return (
                    <div key={domain.label} className="border rounded-lg p-3 space-y-2">
                      <button
                        type="button"
                        onClick={toggleExpand}
                        className="w-full text-left hover:bg-muted/50 transition-colors p-2 -m-2 rounded"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-5">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium text-sm">
                              {index + 1}. {domain.label}
                            </span>
                          </div>
                          <span className="font-bold text-sm">
                            {selectedMetric === 'Totaal'
                              ? formatCurrency(domain.value)
                              : `€ ${domain.value.toFixed(2)}`
                            }
                          </span>
                        </div>
                      </button>

                      {/* Bar chart */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-blue-500"
                          style={{ width: `${(domain.value / maxValue) * 100}%` }}
                        />
                      </div>

                      {/* Subdomain info */}
                      {isExpanded && domain.subdomainLabels.length > 0 && (
                        <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                          <p>
                            <span className="font-semibold text-foreground">Subdomeinen:</span> {domain.subdomainLabels.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
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
