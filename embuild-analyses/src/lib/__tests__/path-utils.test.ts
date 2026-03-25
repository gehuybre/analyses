import { afterEach, describe, expect, it } from "vitest"

import { getDataPath } from "../path-utils"

const ORIGINAL_DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_BASE_URL
const ORIGINAL_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH

describe("getDataPath", () => {
  afterEach(() => {
    if (ORIGINAL_DATA_BASE_URL === undefined) {
      delete process.env.NEXT_PUBLIC_DATA_BASE_URL
    } else {
      process.env.NEXT_PUBLIC_DATA_BASE_URL = ORIGINAL_DATA_BASE_URL
    }

    if (ORIGINAL_BASE_PATH === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH
      return
    }

    process.env.NEXT_PUBLIC_BASE_PATH = ORIGINAL_BASE_PATH
  })

  it("preserves the external host prefix for /data assets", () => {
    process.env.NEXT_PUBLIC_DATA_BASE_URL = "https://gehuybre.github.io/data"

    expect(getDataPath("/data/vastgoed-verkopen/metadata.json")).toBe(
      "https://gehuybre.github.io/data/data/vastgoed-verkopen/metadata.json"
    )
  })

  it("joins analysis result paths under the external data host", () => {
    process.env.NEXT_PUBLIC_DATA_BASE_URL = "https://gehuybre.github.io/data"

    expect(getDataPath("/analyses/vastgoed-verkopen/results/yearly.json")).toBe(
      "https://gehuybre.github.io/data/analyses/vastgoed-verkopen/results/yearly.json"
    )
  })

  it("deduplicates repeated base segments for same-origin paths", () => {
    delete process.env.NEXT_PUBLIC_DATA_BASE_URL
    process.env.NEXT_PUBLIC_BASE_PATH = "/analyses"

    expect(getDataPath("/analyses/nbb-rente/results/metadata.json")).toBe(
      "/analyses/nbb-rente/results/metadata.json"
    )
  })
})
