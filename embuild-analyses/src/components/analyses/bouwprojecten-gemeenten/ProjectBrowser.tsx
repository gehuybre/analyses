"use client"

import { useState, useEffect, useMemo } from "react"
import { useRef } from "react"
import { Project, ProjectMetadata, ProjectFilters, SortOption } from "@/types/project-types"
import { ProjectFiltersComponent } from "./ProjectFilters"
import { ProjectList } from "./ProjectList"
import { ProjectDetailModal } from "./ProjectDetailModal"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Download, Code, Check, Copy } from "lucide-react"
import { getBasePath, getDataPath } from "@/lib/path-utils"

export function ProjectBrowser() {
  const [projects, setProjects] = useState<Project[]>([])
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null)
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set())
  const [failedChunks, setFailedChunks] = useState<Set<number>>(new Set())
  // Track in-flight chunk loads to avoid concurrent fetches for the same chunk
  const loadingChunksRef = useRef<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<ProjectFilters>({})
  const [sortOption, setSortOption] = useState<SortOption>("amount-desc")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [copied, setCopied] = useState(false)

  // Load metadata and first chunk on mount
  useEffect(() => {
    const initializeData = async () => {
      await loadMetadata()
      const success = await loadChunk(0)
      if (!success) {
        setError("Kon eerste data chunk niet laden. Probeer de pagina te verversen.")
      }
      setLoading(false)
    }
    initializeData()
  }, [])

  const loadMetadata = async () => {
    try {
      // Add cache buster to force fresh data (use current timestamp)
      const cacheBuster = new Date().getTime()
      const response = await fetch(getDataPath(`/data/bouwprojecten-gemeenten/projects_metadata.json?t=${cacheBuster}`), {
        cache: 'no-store'
      })
      if (!response.ok) throw new Error("Failed to load metadata")
      const data = await response.json()
      setMetadata(data)
    } catch (err) {
      console.error("Error loading metadata:", err)
      setError("Kon metadata niet laden")
    }
  }

  const loadChunk = async (chunkIndex: number, retries = 3): Promise<boolean> => {
    if (loadedChunks.has(chunkIndex)) return true
    if (failedChunks.has(chunkIndex)) return false
    if (loadingChunksRef.current.has(chunkIndex)) return true

    // mark as in-flight
    loadingChunksRef.current.add(chunkIndex)

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

        const cacheBuster = new Date().getTime()
        const response = await fetch(
          getDataPath(`/data/bouwprojecten-gemeenten/projects_2026_chunk_${chunkIndex}.json?t=${cacheBuster}`),
          { signal: controller.signal, cache: 'no-store' }
        )
        clearTimeout(timeoutId)

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()

        // Append new projects and mark chunk as loaded
        setProjects(prev => {
          // Prevent duplicates by appending only projects that are not already present
          // Use a short-circuit key map based on nis_code+ac_code+ac_short
          const existingKeys = new Set(prev.map(p => `${p.nis_code}||${p.ac_code}||${p.ac_short}`))
          const toAdd = data.filter((p: Project) => !existingKeys.has(`${p.nis_code}||${p.ac_code}||${p.ac_short}`))
          return [...prev, ...toAdd]
        })
        setLoadedChunks(prev => new Set([...prev, chunkIndex]))
        loadingChunksRef.current.delete(chunkIndex)
        return true
      } catch (err) {
        console.error(`Error loading chunk ${chunkIndex} (attempt ${attempt + 1}/${retries}):`, err)

        if (attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        } else {
          // Mark as failed after all retries
          setFailedChunks(prev => new Set([...prev, chunkIndex]))
          loadingChunksRef.current.delete(chunkIndex)
          console.error(`Failed to load chunk ${chunkIndex} after ${retries} attempts`)
          return false
        }
      }
    }
    return false
  }

  // Load all remaining chunks in parallel
  const loadAllChunks = async () => {
    if (!metadata) return

    setLoading(true)
    // Load all chunks in parallel
    const chunkPromises = Array.from({ length: metadata.chunks }, (_, i) => loadChunk(i))
    const results = await Promise.all(chunkPromises)

    // Check if any chunks failed
    const failedCount = results.filter(success => !success).length
    if (failedCount > 0) {
      setError(`${failedCount} chunk(s) konden niet worden geladen. Sommige projecten ontbreken mogelijk.`)
    }

    setLoading(false)
  }

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Apply NIS code filter
    if (filters.nis_code) {
      filtered = filtered.filter(p => p.nis_code === filters.nis_code)
    }

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(p =>
        p.categories.some(cat => filters.categories!.includes(cat))
      )
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.ac_short.toLowerCase().includes(query) ||
        p.ac_long.toLowerCase().includes(query) ||
        p.municipality.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "amount-desc":
          return b.total_amount - a.total_amount
        case "amount-asc":
          return a.total_amount - b.total_amount
        case "municipality":
          return a.municipality.localeCompare(b.municipality)
        case "category":
          return (a.categories[0] || "").localeCompare(b.categories[0] || "")
        default:
          return 0
      }
    })

    return sorted
  }, [projects, filters, sortOption])

  const totalFilteredAmount = useMemo(() => {
    return filteredAndSortedProjects.reduce((sum, p) => sum + p.total_amount, 0)
  }, [filteredAndSortedProjects])

  const hasActiveFilters =
    filters.nis_code ||
    (filters.categories && filters.categories.length > 0) ||
    filters.searchQuery

  const getEmbedCode = (): string => {
    const baseUrl = typeof window !== "undefined"
      ? window.location.origin + getBasePath()
      : ""

    const embedUrl = `${baseUrl}/embed/bouwprojecten-gemeenten/projectbrowser/`

    return `<iframe
  src="${embedUrl}"
  data-data-blog-embed="true"
  width="100%"
  height="800"
  style="border: 0;"
  title="Projectbrowser - Gemeentelijke Investeringen"
  loading="lazy"
></iframe>
<script>
(function () {
  if (window.__DATA_BLOG_EMBED_RESIZER__) return;
  window.__DATA_BLOG_EMBED_RESIZER__ = true;

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "data-blog-embed:resize") return;
    var height = Number(data.height);
    if (!isFinite(height) || height <= 0) return;

    var iframes = document.querySelectorAll('iframe[data-data-blog-embed="true"]');
    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      if (iframe.contentWindow === event.source) {
        iframe.style.height = Math.ceil(height) + "px";
        return;
      }
    }
  });
})();
</script>`
  }

  const copyEmbedCode = async () => {
    const code = getEmbedCode()
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportCSV = () => {
    const headers = [
      "Gemeente",
      "NIS Code",
      "Project Code",
      "Project Naam",
      "Categorieën",
      "Totaal Bedrag",
      "2026",
      "2027",
      "2028",
      "2029",
      "2030",
      "2031",
      "Beschrijving"
    ]

    const rows = filteredAndSortedProjects.map(p => [
      p.municipality,
      p.nis_code,
      p.ac_code,
      p.ac_short,
      p.categories.join("; "),
      p.total_amount.toFixed(2),
      p.yearly_amounts["2026"].toFixed(2),
      p.yearly_amounts["2027"].toFixed(2),
      p.yearly_amounts["2028"].toFixed(2),
      p.yearly_amounts["2029"].toFixed(2),
      p.yearly_amounts["2030"].toFixed(2),
      p.yearly_amounts["2031"].toFixed(2),
      `"${p.ac_long.replace(/"/g, '""')}"`
    ])

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `gemeentelijke-investeringen-projecten-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Show error only if no data loaded at all
  const showCriticalError = error && projects.length === 0

  if (showCriticalError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Fout bij het laden van projecten: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError(null)
            setFailedChunks(new Set())
            loadChunk(0)
          }}
        >
          Opnieuw proberen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold mb-2">Projectbrowser - 2026-2031</h2>
        <p className="text-muted-foreground">
          Doorzoek concrete investeringsprojecten uit de meerjarenplannen van Vlaamse gemeenten.
        </p>
      </div>

      {/* Partial failure warning */}
      {error && projects.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <ProjectFiltersComponent
        filters={filters}
        setFilters={setFilters}
        metadata={metadata}
        projects={projects}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {/* Show explanation if no filters active */}
      {!hasActiveFilters && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
          <p className="text-blue-900 font-medium mb-2">Selecteer een filter om projecten te tonen</p>
          <p className="text-blue-800 text-sm">
            Kies een gemeente, categorie of voer een zoekterm in.
          </p>
        </div>
      )}

      {/* Summary Stats - only show when filters are active */}
      {hasActiveFilters && (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gevonden projecten</p>
                <p className="text-2xl font-bold">
                  {filteredAndSortedProjects.length.toLocaleString("nl-BE")}
                </p>
                {metadata && loadedChunks.size < metadata.chunks && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={loadAllChunks}
                    disabled={loading}
                    className="px-0 h-auto"
                  >
                    {loading ? "Laden..." : `Laad alle projecten (${projects.length}/${metadata.total_projects})`}
                  </Button>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Totaal bedrag</p>
                <p className="text-2xl font-bold">
                  €{(totalFilteredAmount / 1_000_000).toFixed(1)}M
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportCSV}
                  disabled={filteredAndSortedProjects.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" title="Embed code">
                      <Code className="h-4 w-4" />
                      <span className="hidden sm:inline">Embed</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="end">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Embed deze projectbrowser</div>
                      <p className="text-xs text-muted-foreground">
                        Kopieer de onderstaande code om deze projectbrowser in je website te integreren.
                      </p>
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                        {getEmbedCode()}
                      </pre>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={copyEmbedCode}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Gekopieerd!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Kopieer code
                          </>
                        )}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Project List */}
          <ProjectList
            projects={filteredAndSortedProjects}
            onProjectClick={setSelectedProject}
            loading={loading}
          />
        </>
      )}

      {/* Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          metadata={metadata}
        />
      )}
    </div>
  )
}
