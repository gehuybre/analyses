import { useEffect, useMemo, useState } from "react"
import { getDataPath } from "@/lib/path-utils"

type JsonBundleState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export function useJsonBundle<T extends Record<string, unknown>>(paths: Record<string, string>): JsonBundleState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = useMemo(() => JSON.stringify(paths), [paths])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const entries = await Promise.all(
          Object.entries(paths).map(async ([key, path]) => {
            const url = getDataPath(path)
            const response = await fetch(url, { signal: controller.signal })
            if (!response.ok) {
              throw new Error(`Failed to load ${path}: ${response.status}`)
            }
            const json = await response.json()
            return [key, json] as const
          })
        )

        if (!isMounted) return
        setData(Object.fromEntries(entries) as T)
        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        setError(err instanceof Error ? err.message : "Failed to load data")
        setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [cacheKey])

  return { data, loading, error }
}
