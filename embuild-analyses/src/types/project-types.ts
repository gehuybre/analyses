/**
 * Type definitions for municipal investment projects
 */

export interface Project {
  municipality: string
  nis_code: string
  bd_code: string
  bd_short: string
  bd_long: string
  ap_code: string
  ap_short: string
  ap_long: string
  ac_code: string
  ac_short: string
  ac_long: string
  total_amount: number
  amount_per_capita: number
  yearly_amounts: {
    "2026": number
    "2027": number
    "2028": number
    "2029": number
    "2030": number
    "2031": number
  }
  yearly_per_capita: {
    "2026": number
    "2027": number
    "2028": number
    "2029": number
    "2030": number
    "2031": number
  }
  categories: string[]
}

export interface CategoryMetadata {
  id: string
  label: string
  project_count: number
  total_amount: number
  largest_projects: Array<{
    ac_code: string
    ac_short: string
    municipality: string
    nis_code: string
    total_amount: number
    yearly_amounts: Record<string, number>
  }>
}

export interface ProjectMetadata {
  total_projects: number
  total_amount: number
  municipalities: number
  chunks: number
  chunk_size: number
  categories: {
    [key: string]: CategoryMetadata
  }
}

export interface ProjectFilters {
  nis_code?: string
  categories?: string[]
  searchQuery?: string
}

export type SortOption = "amount-desc" | "amount-asc" | "municipality" | "category"
