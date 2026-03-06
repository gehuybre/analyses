"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  const [loadingMetadata, setLoadingMetadata] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [filters, setFilters] = useState<ProjectFilters>({})
  const [sortOption, setSortOption] = useState<SortOption>("amount-desc")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [copied, setCopied] = useState(false)
  const [municipalityReloadCounter, setMunicipalityReloadCounter] = useState(0)

  const municipalityCacheRef = useRef<Map<string, Project[]>>(new Map())
  const metadataVersion = "municipality-index-v1"

  const municipalityIndex = useMemo(() => {
    const index = new Map<string, string>()
    metadata?.municipality_index?.forEach((entry) => {
      index.set(entry.nis_code, entry.file)
    })
    return index
  }, [metadata])

  const loadMetadata = useCallback(async () => {
    setLoadingMetadata(true)
    try {
      const remoteUrl = getDataPath(`/data/bouwprojecten-gemeenten/projects_metadata.json?v=${metadataVersion}`)
      const localUrls = Array.from(
        new Set([
          `${getBasePath()}/data/bouwprojecten-gemeenten/projects_metadata.json?v=${metadataVersion}`,
          `/data/bouwprojecten-gemeenten/projects_metadata.json?v=${metadataVersion}`,
        ])
      )

      let data: ProjectMetadata | null = null

      // Primary source (can be external data host)
      const remoteResponse = await fetch(remoteUrl, { cache: "no-cache" })
      if (remoteResponse.ok) {
        data = await remoteResponse.json()
      }

      // Fallback to local bundled metadata when external metadata is stale/missing municipality index
      const hasIndex = Array.isArray(data?.municipality_index) && data.municipality_index.length > 0
      if (!hasIndex) {
        for (const localUrl of localUrls) {
          const localResponse = await fetch(localUrl, { cache: "no-cache" })
          if (!localResponse.ok) {
            continue
          }
          const localData = await localResponse.json()
          if (Array.isArray(localData?.municipality_index) && localData.municipality_index.length > 0) {
            data = localData
            break
          }
        }
      }

      // Last-resort fallback: merge standalone municipality index file if metadata lacks it
      const hasFinalIndex = Array.isArray(data?.municipality_index) && data.municipality_index.length > 0
      if (!hasFinalIndex) {
        const indexUrls = Array.from(
          new Set([
            `${getBasePath()}/data/bouwprojecten-gemeenten/municipality_index.json?v=${metadataVersion}`,
            `/data/bouwprojecten-gemeenten/municipality_index.json?v=${metadataVersion}`,
          ])
        )

        for (const indexUrl of indexUrls) {
          const indexResponse = await fetch(indexUrl, { cache: "no-cache" })
          if (!indexResponse.ok || !data) {
            continue
          }

          const indexData = await indexResponse.json()
          if (Array.isArray(indexData) && indexData.length > 0) {
            data = {
              ...data,
              municipality_index: indexData
            }
            break
          }
        }
      }

      if (!data) throw new Error("Failed to load metadata")
      municipalityCacheRef.current.clear()
      setMetadata(data)
      setMetadataError(null)
    } catch (err) {
      console.error("Error loading metadata:", err)
      setMetadataError("Kon metadata niet laden")
    } finally {
      setLoadingMetadata(false)
    }
  }, [])

  const fetchMunicipalityProjects = useCallback(
    async (nisCode: string, retries = 3): Promise<Project[] | null> => {
      const cached = municipalityCacheRef.current.get(nisCode)
      if (cached) {
        return cached
      }

      const metadataFile = municipalityIndex.get(nisCode)
      const relativeFile = (metadataFile ?? `municipality/${nisCode}.json`).replace(/^\/+/, "")
      const remoteUrl = getDataPath(`/data/bouwprojecten-gemeenten/${relativeFile}`)
      const candidateUrls = Array.from(
        new Set([
          remoteUrl,
          `${getBasePath()}/data/bouwprojecten-gemeenten/${relativeFile}`,
          `/data/bouwprojecten-gemeenten/${relativeFile}`,
        ])
      )

      for (let attempt = 0; attempt < retries; attempt++) {
        for (const url of candidateUrls) {
          let timeoutId: ReturnType<typeof setTimeout> | undefined
          try {
            const controller = new AbortController()
            timeoutId = setTimeout(() => controller.abort(), 30000)

            const response = await fetch(url, { signal: controller.signal, cache: "no-cache" })
            if (!response.ok) {
              continue
            }

            const data = await response.json()
            if (!Array.isArray(data)) {
              continue
            }

            const municipalityProjects = data as Project[]
            municipalityCacheRef.current.set(nisCode, municipalityProjects)
            return municipalityProjects
          } catch (err) {
            console.error(`Error loading municipality ${nisCode} from ${url}:`, err)
          } finally {
            if (timeoutId) clearTimeout(timeoutId)
          }
        }

        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }

      // Legacy fallback: external host still serves old chunk files without municipality split
      const hasMunicipalityIndex = Array.isArray(metadata?.municipality_index) && metadata.municipality_index.length > 0
      const legacyChunkCount = hasMunicipalityIndex ? 0 : Number(metadata?.chunks ?? 0)
      if (legacyChunkCount > 0 && legacyChunkCount <= 20) {
        try {
          const chunkResults = await Promise.all(
            Array.from({ length: legacyChunkCount }, (_, i) =>
              fetch(getDataPath(`/data/bouwprojecten-gemeenten/projects_2026_chunk_${i}.json`))
                .then(async (res) => (res.ok ? res.json() : []))
                .catch(() => [])
            )
          )

          const municipalityProjects = chunkResults
            .flatMap((chunk) => (Array.isArray(chunk) ? chunk : []))
            .filter((project): project is Project =>
              Boolean(project) &&
              typeof project === "object" &&
              "nis_code" in project &&
              String((project as Project).nis_code) === nisCode
            )
            .sort((a, b) => b.total_amount - a.total_amount)

          if (municipalityProjects.length > 0) {
            municipalityCacheRef.current.set(nisCode, municipalityProjects)
            return municipalityProjects
          }
        } catch (err) {
          console.error(`Legacy chunk fallback failed for municipality ${nisCode}:`, err)
        }
      }

      return null
    },
    [municipalityIndex, metadata]
  )

  useEffect(() => {
    void loadMetadata()
  }, [loadMetadata])

  useEffect(() => {
    if (!metadata) return

    const selectedNisCode = filters.nis_code
    if (!selectedNisCode) {
      setProjects([])
      setProjectsError(null)
      setLoadingProjects(false)
      return
    }

    let cancelled = false

    const loadMunicipality = async () => {
      setLoadingProjects(true)
      setProjectsError(null)
      setProjects([])

      const municipalityProjects = await fetchMunicipalityProjects(selectedNisCode)
      if (cancelled) return

      if (!municipalityProjects) {
        setProjectsError("Kon projecten voor deze gemeente niet laden. Probeer opnieuw.")
        setLoadingProjects(false)
        return
      }

      setProjects(municipalityProjects)
      setLoadingProjects(false)
    }

    void loadMunicipality()

    return () => {
      cancelled = true
    }
  }, [filters.nis_code, metadata, fetchMunicipalityProjects, municipalityReloadCounter])

  const selectedMunicipalityMeta = useMemo(() => {
    if (!filters.nis_code || !metadata?.municipality_index) return null
    return metadata.municipality_index.find(entry => entry.nis_code === filters.nis_code) ?? null
  }, [filters.nis_code, metadata])

  const selectedMunicipalityName = selectedMunicipalityMeta?.municipality ?? projects[0]?.municipality ?? null

  // Filter and sort municipality projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Apply NIS code filter (defensive; dataset is already municipality-specific)
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

  const hasMunicipalitySelected = Boolean(filters.nis_code)
  const hasSecondaryFilters = Boolean(
    (filters.categories && filters.categories.length > 0) || filters.searchQuery
  )

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
    } catch {
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
      "Categorieen",
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

  if (loadingMetadata && !metadata) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">Metadata laden...</p>
      </div>
    )
  }

  if (metadataError && !metadata) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">Fout bij het laden van metadata: {metadataError}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            void loadMetadata()
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

      {/* Municipality loading warning */}
      {projectsError && hasMunicipalitySelected && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800 text-sm">{projectsError}</p>
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto mt-1"
            onClick={() => setMunicipalityReloadCounter((prev) => prev + 1)}
          >
            Probeer opnieuw
          </Button>
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

      {hasMunicipalitySelected && (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Gevonden projecten{selectedMunicipalityName ? ` in ${selectedMunicipalityName}` : ""}
                </p>
                <p className="text-2xl font-bold">
                  {loadingProjects ? "..." : filteredAndSortedProjects.length.toLocaleString("nl-BE")}
                </p>
                {selectedMunicipalityMeta && hasSecondaryFilters && !loadingProjects && (
                  <p className="text-xs text-muted-foreground">
                    {filteredAndSortedProjects.length} van {selectedMunicipalityMeta.project_count.toLocaleString("nl-BE")} projecten in deze gemeente
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Totaal bedrag</p>
                <p className="text-2xl font-bold">
                  {loadingProjects ? "..." : `€${(totalFilteredAmount / 1_000_000).toFixed(1)}M`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExportCSV}
                  disabled={loadingProjects || filteredAndSortedProjects.length === 0}
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
            loading={loadingProjects}
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
