import { useJsonBundle } from "@/lib/use-json-bundle"

export type FaillissementenBundle = {
  monthlyConstruction: unknown[]
  monthlyTotals: unknown[]
  monthlyBySector: unknown[]
  monthlyBySectorProvince: unknown[]
  monthlyProvinces: unknown[]
  monthlyProvincesConstruction: unknown[]
  yearlyConstruction: unknown[]
  yearlyTotals: unknown[]
  yearlyBySector: unknown[]
  yearlyBySectorProvince: unknown[]
  yearlyByDuration: unknown[]
  yearlyByDurationConstruction: unknown[]
  yearlyByDurationProvince: unknown[]
  yearlyByDurationProvinceConstruction: unknown[]
  yearlyByDurationSector: unknown[]
  yearlyByWorkers: unknown[]
  yearlyByWorkersConstruction: unknown[]
  yearlyByWorkersProvince: unknown[]
  yearlyByWorkersProvinceConstruction: unknown[]
  yearlyByWorkersSector: unknown[]
  lookups: unknown
  metadata: unknown
  provincesConstruction: unknown[]
  provincesData: unknown[]
}

export function useFaillissementenData() {
  return useJsonBundle<FaillissementenBundle>({
    monthlyConstruction: "/analyses/faillissementen/results/monthly_construction.json",
    monthlyTotals: "/analyses/faillissementen/results/monthly_totals.json",
    monthlyBySector: "/analyses/faillissementen/results/monthly_by_sector.json",
    monthlyBySectorProvince: "/analyses/faillissementen/results/monthly_by_sector_province.json",
    monthlyProvinces: "/analyses/faillissementen/results/monthly_provinces.json",
    monthlyProvincesConstruction: "/analyses/faillissementen/results/monthly_provinces_construction.json",
    yearlyConstruction: "/analyses/faillissementen/results/yearly_construction.json",
    yearlyTotals: "/analyses/faillissementen/results/yearly_totals.json",
    yearlyBySector: "/analyses/faillissementen/results/yearly_by_sector.json",
    yearlyBySectorProvince: "/analyses/faillissementen/results/yearly_by_sector_province.json",
    yearlyByDuration: "/analyses/faillissementen/results/yearly_by_duration.json",
    yearlyByDurationConstruction: "/analyses/faillissementen/results/yearly_by_duration_construction.json",
    yearlyByDurationProvince: "/analyses/faillissementen/results/yearly_by_duration_province.json",
    yearlyByDurationProvinceConstruction: "/analyses/faillissementen/results/yearly_by_duration_province_construction.json",
    yearlyByDurationSector: "/analyses/faillissementen/results/yearly_by_duration_sector.json",
    yearlyByWorkers: "/analyses/faillissementen/results/yearly_by_workers.json",
    yearlyByWorkersConstruction: "/analyses/faillissementen/results/yearly_by_workers_construction.json",
    yearlyByWorkersProvince: "/analyses/faillissementen/results/yearly_by_workers_province.json",
    yearlyByWorkersProvinceConstruction: "/analyses/faillissementen/results/yearly_by_workers_province_construction.json",
    yearlyByWorkersSector: "/analyses/faillissementen/results/yearly_by_workers_sector.json",
    lookups: "/analyses/faillissementen/results/lookups.json",
    metadata: "/analyses/faillissementen/results/metadata.json",
    provincesConstruction: "/analyses/faillissementen/results/provinces_construction.json",
    provincesData: "/analyses/faillissementen/results/provinces.json",
  })
}
