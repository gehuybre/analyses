import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outDir = path.resolve(__dirname, "..", process.env.OUT_DIR ?? "out")
const basePath = (process.env.BASE_PATH ?? "/data-blog").replace(/\/+$/, "")
const port = Number(process.env.PORT ?? 3000)

const contentTypeByExt = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
])

function isInsideOutDir(candidatePath) {
  const rel = path.relative(outDir, candidatePath)
  return !rel.startsWith("..") && !path.isAbsolute(rel)
}

function resolveToFilePath(urlPathname) {
  // Strip basePath and normalize
  let p = urlPathname.slice(basePath.length)
  if (!p.startsWith("/")) p = `/${p}`
  p = decodeURIComponent(p)

  // Disallow path traversal
  const candidate = path.resolve(outDir, `.${p}`)
  if (!isInsideOutDir(candidate)) return null

  return candidate
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers)
  res.end(body)
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)

    if (url.pathname === "/" || url.pathname === "") {
      return send(res, 302, "Redirecting", { Location: `${basePath}/` })
    }

    if (url.pathname === basePath) {
      return send(res, 302, "Redirecting", { Location: `${basePath}/` })
    }

    if (!url.pathname.startsWith(`${basePath}/`)) {
      return send(res, 404, "Not found")
    }

    const filePath = resolveToFilePath(url.pathname)
    if (!filePath) return send(res, 400, "Bad request")

    const fileCandidates = []

    // If request is a directory-like path, serve index.html
    if (url.pathname.endsWith("/")) {
      fileCandidates.push(path.join(filePath, "index.html"))
    } else {
      fileCandidates.push(filePath)
      // Next export uses trailingSlash; tolerate missing slash by trying /index.html
      fileCandidates.push(path.join(filePath, "index.html"))
      // Also tolerate direct .html paths
      if (!filePath.endsWith(".html")) fileCandidates.push(`${filePath}.html`)
    }

    for (const candidate of fileCandidates) {
      if (!isInsideOutDir(candidate)) continue
      if (!fs.existsSync(candidate)) continue
      if (!fs.statSync(candidate).isFile()) continue

      const ext = path.extname(candidate).toLowerCase()
      const contentType = contentTypeByExt.get(ext) ?? "application/octet-stream"

      res.writeHead(200, { "Content-Type": contentType })
      fs.createReadStream(candidate).pipe(res)
      return
    }

    return send(res, 404, "Not found")
  } catch (err) {
    console.error("[serve-export-with-basepath] request failed", err)
    return send(res, 500, "Internal server error")
  }
})

server.listen(port, () => {
  console.log(`[serve-export-with-basepath] Serving ${outDir} at ${basePath}/ on http://localhost:${port}`)
})
