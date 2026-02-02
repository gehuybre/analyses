"use client"

import React, { useEffect, useState } from "react"
import { EmbeddableSection } from "@/components/analyses/shared/EmbeddableSection"
import { StartersStoppersEmbed } from "@/components/analyses/starters-stoppers/StartersStoppersEmbed"
import { VastgoedVerkopenEmbed } from "@/components/analyses/vastgoed-verkopen/VastgoedVerkopenEmbed"
import { FaillissementenEmbed } from "@/components/analyses/faillissementen/FaillissementenEmbed"
import { HuishoudensgroeiEmbed } from "@/components/analyses/huishoudensgroei/HuishoudensgroeiEmbed"
import { EnergiekaartPremiesEmbed } from "@/components/analyses/energiekaart-premies/EnergiekaartPremiesEmbed"
import { VergunningenAanvragenEmbed } from "@/components/analyses/vergunningen-aanvragen/VergunningenAanvragenEmbed"
import { GebouwenparkEmbed } from "@/components/analyses/gebouwenpark/GebouwenparkEmbed"
import { InvesteringenEmbed } from "@/components/analyses/gemeentelijke-investeringen/InvesteringenEmbed"
import { InvesteringenBVCategorySection } from "@/components/analyses/gemeentelijke-investeringen/InvesteringenBVCategorySection"
import { InvesteringenBVDifferenceSection } from "@/components/analyses/gemeentelijke-investeringen/InvesteringenBVDifferenceSection"
import { InvesteringenREKCategorySection } from "@/components/analyses/gemeentelijke-investeringen/InvesteringenREKCategorySection"
import { InvesteringenBVScatterSection } from "@/components/analyses/gemeentelijke-investeringen/InvesteringenBVScatterSection"
import { InvesteringenREKScatterSection } from "@/components/analyses/gemeentelijke-investeringen/InvesteringenREKScatterSection"
import { BouwprojectenEmbed } from "@/components/analyses/bouwprojecten-gemeenten/BouwprojectenEmbed"
import { BouwondernemersEmbed } from "@/components/analyses/bouwondernemers/BouwondernemersEmbed"
import { BetaalbaarArrEmbed } from "@/components/analyses/betaalbaar-arr/BetaalbaarArrEmbed"
import { SilcEnergieEmbed } from "@/components/analyses/silc-energie-2023/SilcEnergieEmbed"
import { PeriodComparisonEmbed } from "@/components/analyses/vergunningen-goedkeuringen/PeriodComparisonEmbed"
import { VergunningenEmbed } from "@/components/analyses/vergunningen-goedkeuringen/VergunningenEmbed"
import { ArbeidersBediendenEmbed } from "@/components/analyses/arbeiders-bedienden/ArbeidersBediendenEmbed"
import { ProvinceCode, RegionCode } from "@/lib/geo-utils"
import { getEmbedConfig, getValidSections } from "@/lib/embed-config"
import { EmbedDataRow, MunicipalityData } from "@/lib/embed-types"
import { getEmbedDataModule } from "@/lib/embed-data-registry"

type ViewType = "chart" | "table" | "map"
type StopHorizon = 1 | 2 | 3 | 4 | 5
type StartersStoppersSection = "starters" | "stoppers" | "survival"
type ChartOrTableViewType = "chart" | "table"

interface EmbedClientProps {
  slug: string
  section: string
}

/**
 * Props for StartersStoppersEmbed custom component
 */
interface StartersStoppersEmbedProps {
  section: StartersStoppersSection
  viewType: ViewType
  horizon: StopHorizon
  region: RegionCode | null
  province: ProvinceCode | null
  sector: string | null
}

interface UrlParams {
  view: ViewType
  horizon: number | null
  year: number | null
  geo: string | null
  type: string | null
  region: RegionCode | null
  province: ProvinceCode | null
  arrondissement: string | null
  municipality: string | null
  sector: string | null
  measure: string | null
  metric: string | null
  timeRange: string | null
  subView: string | null
  showDecline: boolean
  geoLevel: string | null
  chartType: string | null
  showMovingAverage: boolean
  showProvinceBoundaries: boolean
}

function getParamsFromUrl(slug: string): UrlParams {
  if (typeof window === "undefined") {
    return { view: "chart", horizon: null, year: null, geo: null, type: null, region: null, province: null, arrondissement: null, municipality: null, sector: null, measure: null, metric: null, timeRange: null, subView: null, showDecline: false, geoLevel: null, chartType: null, showMovingAverage: false, showProvinceBoundaries: false }
  }

  const params = new URLSearchParams(window.location.search)
  const getParam = (key: string) => {
    const namespacedKey = `${slug}.${key}`
    return params.get(namespacedKey) ?? params.get(key)
  }

  // View type
  const view = getParam("view")
  const viewType: ViewType = (view === "table" || view === "map") ? view : "chart"

  // Horizon (used differently per embed: stop horizon for starters-stoppers, year for some other embeds)
  const horizonStr = getParam("horizon")
  const horizon = horizonStr ? parseInt(horizonStr, 10) : null

  const yearStr = getParam("year")
  const year = yearStr ? parseInt(yearStr, 10) : null

  // Geo filter (generic NIS-like code: region/province/...)
  const geo = getParam("geo") || null

  // Type filter (e.g. vastgoed-verkopen property type)
  const type = getParam("type") || null

  // Region
  const regionStr = getParam("region")
  const region: RegionCode | null = regionStr as RegionCode | null

  // Province
  const provinceStr = getParam("province")
  const province: ProvinceCode | null = provinceStr as ProvinceCode | null

  // Arrondissement
  const arrondissement = getParam("arr") || null

  // Municipality
  const municipality = getParam("municipality") || null

  // Sector (NACE code)
  const sector = getParam("sector") || null

  // Measure (for energiekaart-premies)
  const measure = getParam("measure") || null

  // Metric (for vergunningen-aanvragen)
  const metric = getParam("metric") || null

  // Time Range - support both "timeRange" (legacy) and "range" (from store)
  const timeRange = getParam("range") || getParam("timeRange") || null

  // Sub View (for vergunningen-aanvragen)
  const subView = getParam("subView") || null

  // Show Decline (for huishoudensgroei): allow both explicit boolean and legacy "sector=decline"
  const showDecline = getParam("showDecline") === "true" || sector === "decline"

  // Geographic level (for map visualization)
  const geoLevel = getParam("geoLevel") || null

  // Chart type (composed, line, bar, area)
  const chartType = getParam("chartType") || null

  // Show moving average (boolean: 1/0 or true/false)
  const maStr = getParam("ma")
  const showMovingAverage = maStr === "1" || maStr === "true"

  // Show province boundaries on map (boolean: 1/0 or true/false)
  const boundariesStr = getParam("boundaries")
  const showProvinceBoundaries = boundariesStr === "1" || boundariesStr === "true"

  return {
    view: viewType,
    horizon: Number.isFinite(horizon as number) ? horizon : null,
    year: Number.isFinite(year as number) ? year : null,
    geo,
    type,
    region,
    province,
    arrondissement,
    municipality,
    sector,
    measure,
    metric,
    timeRange,
    subView,
    showDecline,
    geoLevel,
    chartType,
    showMovingAverage,
    showProvinceBoundaries,
  }
}

function toChartOrTableViewType(viewType: ViewType): ChartOrTableViewType {
  return viewType === "table" ? "table" : "chart"
}

function toStopHorizon(horizon: number | null): StopHorizon {
  if (!horizon) return 1
  if (horizon >= 1 && horizon <= 5) return horizon as StopHorizon
  return 1
}

export function EmbedClient({ slug, section }: EmbedClientProps) {
  const [urlParams, setUrlParams] = useState<UrlParams>({
    view: "chart",
    horizon: null,
    year: null,
    geo: null,
    type: null,
    region: null,
    province: null,
    arrondissement: null,
    municipality: null,
    sector: null,
    measure: null,
    metric: null,
    timeRange: null,
    subView: null,
    showDecline: false,
    geoLevel: null,
    chartType: null,
    showMovingAverage: false,
    showProvinceBoundaries: false,
  })

  // State for dynamically loaded data
  const [embedData, setEmbedData] = useState<{
    data: EmbedDataRow[] | null
    municipalities: MunicipalityData[] | null
    loading: boolean
    error: string | null
  }>({
    data: null,
    municipalities: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    setUrlParams(getParamsFromUrl(slug))
  }, [slug])

  // Auto-resize iframe via postMessage
  useEffect(() => {
    if (typeof window === "undefined" || window.self === window.top) {
      // Not in an iframe or no parent window
      return
    }

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight
      window.parent.postMessage(
        {
          type: "data-blog-embed:resize",
          height,
        },
        "*"
      )
    }

    // Send initial height
    sendHeight()

    // Observe DOM changes and resize events
    const resizeObserver = new ResizeObserver(() => {
      sendHeight()
    })

    resizeObserver.observe(document.body)

    // Also listen to window resize (for responsive layouts)
    window.addEventListener("resize", sendHeight)

    // Send height after a short delay to catch lazy-rendered content
    const timeoutId = setTimeout(sendHeight, 100)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", sendHeight)
      clearTimeout(timeoutId)
    }
  }, [embedData.loading, urlParams.view])

  // Load data from registry for standard embeds
  useEffect(() => {
    let isMounted = true
    const config = getEmbedConfig(slug, section)

    console.log("[EmbedClient] Loading data for:", { slug, section, configType: config?.type })

    if (!config || config.type !== "standard") {
      console.log("[EmbedClient] Skipping data load - not a standard embed")
      return () => {
        isMounted = false
      }
    }

    setEmbedData((prev) => ({ ...prev, loading: true }))

    async function load() {
      try {
        const dataModule = await getEmbedDataModule(slug, section)

        console.log("[EmbedClient] Data module:", {
          found: !!dataModule,
          dataLength: dataModule?.data?.length,
          municipalitiesLength: dataModule?.municipalities?.length,
        })

        if (!dataModule) {
          console.error("[EmbedClient] Data not available for:", { slug, section })
          if (!isMounted) return
          setEmbedData({
            data: null,
            municipalities: null,
            loading: false,
            error: "Data niet beschikbaar. Neem contact op met de beheerder.",
          })
          return
        }

        if (!isMounted) return
        console.log("[EmbedClient] Data loaded successfully")
        setEmbedData({
          data: dataModule.data,
          municipalities: dataModule.municipalities,
          loading: false,
          error: null,
        })
      } catch (err) {
        console.error("[EmbedClient] Failed to load data:", {
          slug,
          section,
          error: err,
        })

        const errorMessage =
          err instanceof Error
            ? `Fout bij laden van data: ${err.message}`
            : "Er is een fout opgetreden bij het laden van de data."

        if (!isMounted) return
        setEmbedData({
          data: null,
          municipalities: null,
          loading: false,
          error: errorMessage,
        })
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [slug, section])

  // Get config
  const config = getEmbedConfig(slug, section)

  if (!config) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Embed niet gevonden: {slug}/{section}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Deze combinatie van analyse en sectie is niet beschikbaar voor embedding.
        </p>
      </div>
    )
  }

  // Handle custom embeds
  if (config.type === "custom") {
    // Handle StartersStoppersEmbed
    if (config.component === "StartersStoppersEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <StartersStoppersEmbed
          section={section as StartersStoppersSection}
          viewType={urlParams.view === "map" ? "chart" : urlParams.view}
          horizon={toStopHorizon(urlParams.horizon)}
          region={urlParams.region}
          province={urlParams.province}
          sector={urlParams.sector}
        />
      )
    }

    // Handle VastgoedVerkopenEmbed
    if (config.component === "VastgoedVerkopenEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <VastgoedVerkopenEmbed
          section={section as "transacties" | "prijzen" | "transacties-kwartaal" | "prijzen-kwartaal"}
          viewType={toChartOrTableViewType(urlParams.view)}
          type={urlParams.type ?? undefined}
          geo={urlParams.geo}
        />
      )
    }

    // Handle FaillissementenEmbed
    if (config.component === "FaillissementenEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <FaillissementenEmbed
          section={section as "evolutie" | "leeftijd" | "bedrijfsgrootte" | "sectoren"}
          viewType={toChartOrTableViewType(urlParams.view)}
          sector={urlParams.sector}
          year={urlParams.year ?? (urlParams.horizon && urlParams.horizon >= 1900 ? urlParams.horizon : null)}
          timeRange={urlParams.timeRange}
          provinceCode={urlParams.province}
        />
      )
    }

    // Handle HuishoudensgroeiEmbed
    if (config.component === "HuishoudensgroeiEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <HuishoudensgroeiEmbed
          section={section as "evolutie" | "ranking" | "size-breakdown"}
          viewType={toChartOrTableViewType(urlParams.view)}
          geo={urlParams.geo}
          horizonYear={urlParams.horizon && urlParams.horizon >= 1900 ? urlParams.horizon : 2033}
          showDecline={urlParams.showDecline}
        />
      )
    }

    // Handle VergunningenAanvragenEmbed
    if (config.component === "VergunningenAanvragenEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      // Parse metric from URL params with section-specific defaults
      // Sloop doesn't have "w" (wooneenheden), so default to "m2" (oppervlakte)
      const defaultMetric = section === "sloop" ? "m2" : "w"
      const metric = urlParams.metric || defaultMetric

      // Parse timeRange from URL params (defaults to "yearly")
      const timeRange = (urlParams.timeRange as "quarterly" | "yearly") || "yearly"

      // Parse subView from URL params (defaults to "total")
      const subView = (urlParams.subView as "total" | "type" | "besluit") || "total"

      return (
        <VergunningenAanvragenEmbed
          section={section as "nieuwbouw" | "verbouw" | "sloop"}
          viewType={toChartOrTableViewType(urlParams.view)}
          metric={metric}
          timeRange={timeRange}
          subView={subView}
        />
      )
    }

    // Handle EnergiekaartPremiesEmbed
    if (config.component === "EnergiekaartPremiesEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <EnergiekaartPremiesEmbed
          section={section as "aantal-premies" | "bedrag-premies" | "aantal-beschermd" | "bedrag-beschermd"}
          measure={urlParams.measure ?? undefined}
        />
      )
    }

    // Handle GebouwenparkEmbed
    if (config.component === "GebouwenparkEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <GebouwenparkEmbed
          section={section as "evolutie"}
        />
      )
    }

    // Handle InvesteringenEmbed
    if (config.component === "InvesteringenEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <InvesteringenEmbed
          section={section as "investments-bv" | "investments-rek"}
          viewType={toChartOrTableViewType(urlParams.view)}
        />
      )
    }

    // Handle InvesteringenCategoryEmbed
    if (config.component === "InvesteringenCategoryEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      if (section === "bv-category-breakdown") {
        return <InvesteringenBVCategorySection />
      }

      if (section === "rek-category-breakdown") {
        return <InvesteringenREKCategorySection />
      }
    }

    // Handle InvesteringenBVScatterEmbed
    if (config.component === "InvesteringenBVScatterEmbed") {
      return <InvesteringenBVScatterSection />
    }

    // Handle InvesteringenREKScatterEmbed
    if (config.component === "InvesteringenREKScatterEmbed") {
      return <InvesteringenREKScatterSection />
    }

    if (config.component === "InvesteringenBVDifferenceEmbed") {
      return <InvesteringenBVDifferenceSection viewType={toChartOrTableViewType(urlParams.view)} />
    }

    // Handle BouwprojectenEmbed
    if (config.component === "BouwprojectenEmbed") {
      return <BouwprojectenEmbed />
    }

    // Handle BouwondernemersEmbed
    if (config.component === "BouwondernemersEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <BouwondernemersEmbed
          section={section as "overview" | "by-sector" | "by-gender" | "by-region" | "by-age"}
          viewType={toChartOrTableViewType(urlParams.view)}
          displayMode={(urlParams.metric === "index" || urlParams.type === "index") ? "index" : "absolute"}
        />
      )
    }

    // Handle BetaalbaarArrEmbed
    if (config.component === "BetaalbaarArrEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <BetaalbaarArrEmbed
          section={section as "gebouwenpark" | "huishoudens" | "vergunningen" | "correlaties" | "vergelijking"}
          viewType={toChartOrTableViewType(urlParams.view)}
        />
      )
    }

    // Handle SilcEnergieEmbed
    if (config.component === "SilcEnergieEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <SilcEnergieEmbed
          section={section as "renovatiemaatregelen" | "verwarmingssystemen" | "energiebronnen" | "isolatieverbeteringen"}
        />
      )
    }

    // Handle VergunningenEmbed
    if (config.component === "VergunningenEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <VergunningenEmbed
          section={section as "renovatie" | "nieuwbouw-dwell" | "nieuwbouw-apt" | "nieuwbouw-house" | "nieuwbouw"}
          viewType={urlParams.view}
          timeRange={urlParams.timeRange}
          category={urlParams.type}
          geoLevel={urlParams.geoLevel}
          region={urlParams.region}
          province={urlParams.province}
          arrondissement={urlParams.arrondissement}
          municipality={urlParams.municipality}
          chartType={urlParams.chartType}
          showMovingAverage={urlParams.showMovingAverage}
          showProvinceBoundaries={urlParams.showProvinceBoundaries}
        />
      )
    }

    // Handle PeriodComparisonEmbed
    if (config.component === "PeriodComparisonEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <PeriodComparisonEmbed
          section={section as
            | "renovatie-vergelijking"
            | "renovatie-vergelijking-aantallen"
            | "renovatie-vergelijking-percentage"
            | "nieuwbouw-vergelijking"
            | "nieuwbouw-vergelijking-aantallen"
            | "nieuwbouw-vergelijking-percentage"
          }
        />
      )
    }

    // Handle ArbeidersBediendenEmbed
    if (config.component === "ArbeidersBediendenEmbed") {
      const validSections = getValidSections(slug)
      if (!validSections.includes(section)) {
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Ongeldige sectie: {section}. Geldige opties: {validSections.join(", ")}
            </p>
          </div>
        )
      }

      return (
        <ArbeidersBediendenEmbed
          section={section as "evolution-by-type" | "evolution-by-gender"}
          viewType={urlParams.view === "map" ? "chart" : urlParams.view}
          region={urlParams.region}
          province={urlParams.province}
        />
      )
    }

    // Unknown custom component
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">
          Custom component &quot;{config.component}&quot; not registered
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Add handling for this component in EmbedClient.tsx
        </p>
      </div>
    )
  }

  // Handle standard embeds
  if (config.type === "standard") {
    if (embedData.loading) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Laden...</p>
        </div>
      )
    }

    if (embedData.error) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-500 whitespace-pre-wrap">{embedData.error}</p>
        </div>
      )
    }

    if (!embedData.data || !embedData.municipalities) {
      return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Geen data beschikbaar</p>
        </div>
      )
    }

    return (
      <EmbeddableSection<EmbedDataRow>
        slug={slug}
        section={section}
        title={config.title}
        data={embedData.data}
        municipalities={embedData.municipalities}
        metric={config.metric}
        label={config.label}
        viewType={urlParams.view}
        timeRange={urlParams.timeRange}
      />
    )
  }

  // Unsupported custom component
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">
        Onbekend embed type voor: {slug}/{section}
      </p>
    </div>
  )
}
