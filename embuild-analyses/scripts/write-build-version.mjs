import fs from "node:fs/promises"
import path from "node:path"

const version =
  process.env.NEXT_PUBLIC_DEPLOY_VERSION ||
  process.env.GITHUB_SHA ||
  `local-${new Date().toISOString()}`

const payload = {
  version,
  builtAt: new Date().toISOString(),
}

const outputPath = path.join(process.cwd(), "public", "version.json")

await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

console.log(`Wrote build version to ${outputPath}: ${version}`)
