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
import { X, Search, Check, ChevronsUpDown } from "lucide-react"
import { useMemo, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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
  const [searchInput, setSearchInput] = useState("")
  const [muniOpen, setMuniOpen] = useState(false)

  // Get unique municipalities with NIS codes from loaded projects
  const municipalities = useMemo(() => {
    const unique = Array.from(new Set(
      projects.map(p => JSON.stringify({ nis_code: p.nis_code, name: p.municipality }))
    )).map(str => JSON.parse(str) as { nis_code: string; name: string })
    return unique.sort((a, b) => a.name.localeCompare(b.name))
  }, [projects])

  // Calculate project counts per category for the selected municipality
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    // Initialize with 0 for all categories from metadata
    if (metadata) {
      Object.keys(metadata.categories).forEach(id => {
        counts[id] = 0
      })
    }

    // Filter projects by NIS code if one is selected
    const relevantProjects = filters.nis_code
      ? projects.filter(p => p.nis_code === filters.nis_code)
      : projects

    // Count categories in relevant projects
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
      const { nis_code, ...rest } = filters
      setFilters(rest)
    } else {
      setFilters({ ...filters, nis_code: value })
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filters.categories || []
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId]

    if (newCategories.length === 0) {
      const { categories, ...rest } = filters
      setFilters(rest)
    } else {
      setFilters({ ...filters, categories: newCategories })
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Sanitize and limit search query to 200 characters
    const sanitizedQuery = searchInput.trim().slice(0, 200)
    if (sanitizedQuery) {
      setFilters({ ...filters, searchQuery: sanitizedQuery })
    } else {
      const { searchQuery, ...rest } = filters
      setFilters(rest)
    }
  }

  const handleReset = () => {
    setFilters({})
    setSearchInput("")
  }

  const hasActiveFilters =
    filters.nis_code ||
    (filters.categories && filters.categories.length > 0) ||
    filters.searchQuery

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

      {/* Municipality and Sort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="municipality">Gemeente</Label>
          <Popover open={muniOpen} onOpenChange={setMuniOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={muniOpen}
                className="w-full justify-between font-normal"
                id="municipality"
              >
                {filters.nis_code
                  ? municipalities.find(m => m.nis_code === filters.nis_code)?.name
                  : "alle gemeenten"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command filter={(value, search) => {
                // Custom filter for case-insensitive searching
                return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
              }}>
                <CommandInput placeholder="Zoek gemeente..." />
                <CommandList>
                  <CommandEmpty>geen gemeente gevonden.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        handleMunicipalityChange("all")
                        setMuniOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !filters.nis_code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Alle gemeenten
                    </CommandItem>
                    {municipalities.map((muni) => (
                      <CommandItem
                        key={muni.nis_code}
                        value={muni.name}
                        onSelect={(currentValue) => {
                          const nis_code = municipalities.find(m => m.name === currentValue)?.nis_code || currentValue
                          handleMunicipalityChange(nis_code)
                          setMuniOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.nis_code === muni.nis_code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {muni.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
      {metadata && (
        <div>
          <Label className="mb-2 block">categorieën</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metadata.categories)
              .sort((a, b) => {
                const countA = categoryCounts[a[0]] ?? 0
                const countB = categoryCounts[b[0]] ?? 0
                // Sort by current counts, then by label
                if (countB !== countA) return countB - countA
                return a[1].label.localeCompare(b[1].label)
              })
              .map(([id, cat]) => {
                const isActive = filters.categories?.includes(id)
                const currentCount = categoryCounts[id] ?? 0

                // Only show badge if count > 0 OR if it was already selected (to allow deselecting)
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
                Gemeente: {municipalities.find(m => m.nis_code === filters.nis_code)?.name}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const { nis_code, ...rest } = filters
                    setFilters(rest)
                  }}
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
            {filters.searchQuery && (
              <Badge variant="secondary">
                Zoekterm: &quot;{filters.searchQuery}&quot;
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const { searchQuery, ...rest } = filters
                    setFilters(rest)
                    setSearchInput("")
                  }}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Search - moved to bottom and made smaller */}
      <form onSubmit={handleSearchSubmit} className="pt-4 border-t">
        <Label htmlFor="search" className="text-sm mb-2 block">Zoeken in projectnamen en beschrijvingen</Label>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Zoekterm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9"
              maxLength={200}
            />
          </div>
          <Button type="submit" size="sm">Zoeken</Button>
        </div>
      </form>
    </div>
  )
}
