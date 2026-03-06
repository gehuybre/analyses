"use client"

import { ProjectFilters, ProjectMetadata, SortOption, Project } from "@/types/project-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface ProjectFiltersComponentProps {
  filters: ProjectFilters
  setFilters: (filters: ProjectFilters) => void
  metadata: ProjectMetadata | null
  projects: Project[]
  sortOption: SortOption
  setSortOption: (option: SortOption) => void
}

export function ProjectFiltersComponent({
  filters,
  setFilters,
  metadata,
  projects,
  sortOption,
  setSortOption,
}: ProjectFiltersComponentProps) {
  const [municipalityInput, setMunicipalityInput] = useState("")
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false)

  // Prefer metadata index (all municipalities), fallback to loaded projects
  const municipalities = useMemo(() => {
    if (metadata?.municipality_index && metadata.municipality_index.length > 0) {
      return metadata.municipality_index
        .map((entry) => ({ nis_code: entry.nis_code, name: entry.municipality }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    const unique = Array.from(new Set(
      projects.map(p => JSON.stringify({ nis_code: p.nis_code, name: p.municipality }))
    )).map(str => JSON.parse(str) as { nis_code: string; name: string })
    return unique.sort((a, b) => a.name.localeCompare(b.name))
  }, [metadata, projects])

  const selectedMunicipalityName = useMemo(() => {
    if (!filters.nis_code) return ""
    return municipalities.find(m => m.nis_code === filters.nis_code)?.name ?? ""
  }, [filters.nis_code, municipalities])

  useEffect(() => {
    setMunicipalityInput(selectedMunicipalityName)
  }, [selectedMunicipalityName])

  const filteredMunicipalities = useMemo(() => {
    const query = municipalityInput.trim().toLowerCase()
    const scored = municipalities
      .map((muni) => {
        const name = muni.name.toLowerCase()
        let score = 3
        if (!query) score = 0
        else if (name === query) score = 0
        else if (name.startsWith(query)) score = 1
        else if (name.includes(query)) score = 2

        return { ...muni, score }
      })
      .filter((entry) => entry.score < 3)
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score
        return a.name.localeCompare(b.name)
      })

    return scored
  }, [municipalities, municipalityInput])

  // Calculate project counts per category for the selected municipality
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    if (metadata) {
      Object.keys(metadata.categories).forEach(id => {
        counts[id] = 0
      })
    }

    const relevantProjects = filters.nis_code
      ? projects.filter(p => p.nis_code === filters.nis_code)
      : []

    relevantProjects.forEach(project => {
      project.categories.forEach(catId => {
        if (counts[catId] !== undefined) {
          counts[catId]++
        }
      })
    })

    return counts
  }, [projects, filters.nis_code, metadata])

  const handleMunicipalityChange = (value: string) => {
    if (value === "all") {
      const nextFilters = { ...filters }
      delete nextFilters.nis_code
      delete nextFilters.categories
      delete nextFilters.searchQuery
      setFilters(nextFilters)
      setMunicipalityInput("")
      return
    }

    const selected = municipalities.find(m => m.nis_code === value)
    const nextFilters = { ...filters, nis_code: value }
    delete nextFilters.searchQuery
    setFilters(nextFilters)
    setMunicipalityInput(selected?.name ?? "")
    setIsAutocompleteOpen(false)
  }

  const handleMunicipalityInputChange = (rawValue: string) => {
    setMunicipalityInput(rawValue)
    setIsAutocompleteOpen(true)

    // If user edits the selected municipality name, clear municipality filter.
    if (filters.nis_code && rawValue.trim().toLowerCase() !== selectedMunicipalityName.toLowerCase()) {
      const nextFilters = { ...filters }
      delete nextFilters.nis_code
      delete nextFilters.categories
      delete nextFilters.searchQuery
      setFilters(nextFilters)
    }

    const value = rawValue.trim()

    if (!value) {
      handleMunicipalityChange("all")
      return
    }

    const exactMatch = municipalities.find(
      m => m.name.toLowerCase() === value.toLowerCase()
    )
    if (exactMatch) {
      handleMunicipalityChange(exactMatch.nis_code)
    }
  }

  const resolveMunicipalityFromInput = (rawValue: string) => {
    const value = rawValue.trim().toLowerCase()
    if (!value) {
      handleMunicipalityChange("all")
      return
    }

    const exactMatch = municipalities.find(
      m => m.name.toLowerCase() === value
    )
    if (exactMatch) {
      handleMunicipalityChange(exactMatch.nis_code)
      return
    }

    const startsWithMatch = municipalities.find(
      m => m.name.toLowerCase().startsWith(value)
    )
    if (startsWithMatch) {
      handleMunicipalityChange(startsWithMatch.nis_code)
      return
    }

    setIsAutocompleteOpen(true)
  }

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filters.categories || []
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId]

    if (newCategories.length === 0) {
      const nextFilters = { ...filters }
      delete nextFilters.categories
      setFilters(nextFilters)
    } else {
      setFilters({ ...filters, categories: newCategories })
    }
  }

  const handleReset = () => {
    setFilters({})
    setMunicipalityInput("")
  }

  const hasActiveFilters =
    filters.nis_code ||
    (filters.categories && filters.categories.length > 0)

  const municipalitySelected = Boolean(filters.nis_code)

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        )}
      </div>

      {/* Municipality autocomplete + sort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="municipality-search">Gemeente</Label>
          <div className="relative">
            <Input
              id="municipality-search"
              placeholder={municipalities.length > 0 ? "Typ om gemeente te zoeken..." : "Gemeenten laden..."}
              value={municipalityInput}
              onChange={(e) => handleMunicipalityInputChange(e.target.value)}
              onFocus={() => setIsAutocompleteOpen(true)}
              onBlur={(e) => {
                window.setTimeout(() => {
                  setIsAutocompleteOpen(false)
                  resolveMunicipalityFromInput(e.target.value)
                }, 120)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  const topMatch = filteredMunicipalities[0]
                  if (topMatch) {
                    handleMunicipalityChange(topMatch.nis_code)
                  } else {
                    resolveMunicipalityFromInput(municipalityInput)
                  }
                }
              }}
              autoComplete="off"
            />

            {isAutocompleteOpen && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-background shadow-lg">
                {filteredMunicipalities.length > 0 ? (
                  <>
                    {(filters.nis_code || municipalityInput.trim()) && (
                      <button
                        type="button"
                        className="block w-full border-b px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          handleMunicipalityChange("all")
                        }}
                      >
                        Alle gemeenten
                      </button>
                    )}
                    {filteredMunicipalities.map((muni) => (
                      <button
                        key={muni.nis_code}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          handleMunicipalityChange(muni.nis_code)
                        }}
                      >
                        {muni.name}
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Geen gemeente gevonden</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="sort">Sorteren</Label>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount-desc">bedrag (hoog → laag)</SelectItem>
              <SelectItem value="amount-asc">bedrag (laag → hoog)</SelectItem>
              <SelectItem value="municipality">gemeente (a → z)</SelectItem>
              <SelectItem value="category">categorie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories */}
      {metadata && municipalitySelected && (
        <div>
          <Label className="mb-2 block">categorieën</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metadata.categories)
              .sort((a, b) => {
                const countA = categoryCounts[a[0]] ?? 0
                const countB = categoryCounts[b[0]] ?? 0
                if (countB !== countA) return countB - countA
                return a[1].label.localeCompare(b[1].label)
              })
              .map(([id, cat]) => {
                const isActive = filters.categories?.includes(id)
                const currentCount = categoryCounts[id] ?? 0
                if (currentCount === 0 && !isActive) return null

                return (
                  <Badge
                    key={id}
                    variant={isActive ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90"
                    onClick={() => handleCategoryToggle(id)}
                  >
                    {cat.label} ({currentCount})
                  </Badge>
                )
              })}
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">actieve filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.nis_code && (
              <Badge variant="secondary">
                Gemeente: {selectedMunicipalityName || filters.nis_code}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => handleMunicipalityChange("all")}
                />
              </Badge>
            )}
            {filters.categories?.map(catId => {
              const cat = metadata?.categories[catId]
              return (
                <Badge key={catId} variant="secondary">
                  {cat?.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleCategoryToggle(catId)}
                  />
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
