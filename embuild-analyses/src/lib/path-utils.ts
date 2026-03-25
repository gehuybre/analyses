/**
 * Utility functions for handling paths with basePath support
 */

const deployVersion = process.env.NEXT_PUBLIC_DEPLOY_VERSION || ""

function splitPathSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean)
}

function joinBaseAndPath(base: string, normalizedPath: string): string {
  if (!base) {
    return normalizedPath
  }

  const isAbsoluteUrl = /^https?:\/\//.test(base)
  const parsed = new URL(base, isAbsoluteUrl ? undefined : "https://example.invalid")
  const baseSegments = splitPathSegments(parsed.pathname)
  const pathSegments = splitPathSegments(normalizedPath)

  if (
    !isAbsoluteUrl &&
    baseSegments.length > 0 &&
    pathSegments.length > 0 &&
    baseSegments[baseSegments.length - 1] === pathSegments[0]
  ) {
    pathSegments.shift()
  }

  parsed.pathname = `/${[...baseSegments, ...pathSegments].join("/")}`
  parsed.search = ""
  parsed.hash = ""

  if (isAbsoluteUrl) {
    return parsed.toString()
  }

  return parsed.pathname
}

/**
 * Get the base path for the application.
 * In production (GitHub Pages), this is '/analyses'
 * In development, this is ''
 *
 * This function computes the base path dynamically to handle both:
 * - Server-side rendering (uses NEXT_PUBLIC_BASE_PATH env var)
 * - Client-side runtime (infers from window.location)
 */
export function getBasePath(): string {
  // During SSR/SSG, use environment variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_PATH || '';
  }

  // Client-side: infer from current URL path
  if (window.location.pathname.startsWith('/analyses')) {
    return '/analyses';
  }
  if (window.location.pathname.startsWith('/data-blog')) {
    return '/data-blog';
  }
  return '';
}

/**
 * Get the base URL for data files (can be an external GitHub Pages repo).
 * Falls back to the app base path when not configured.
 */
export function getDataBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_DATA_BASE_URL || "";
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "gehuybre.github.io") {
      return `${window.location.origin.replace(/\/+$/, "")}/data`;
    }
  }
  return getBasePath();
}

/**
 * Get a data URL with proper base handling (supports external data host).
 * @param path - The path relative to the data host (e.g., '/data/file.json')
 */
export function getDataPath(path: string): string {
  const baseUrl = getDataBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return joinBaseAndPath(baseUrl, normalizedPath);
}

/**
 * Get a same-origin URL for a file in /public, respecting basePath only.
 * Unlike getPublicPath(), this never rewrites /data/* to an external data host.
 */
export function getLocalPublicPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = getBasePath();
  return joinBaseAndPath(basePath, normalizedPath);
}

/**
 * Get candidate URLs for loading a data file:
 * 1) external data host (if configured)
 * 2) local same-origin public file fallback
 */
export function getDataPathCandidates(path: string): string[] {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const primary = getDataPath(normalizedPath);
  const localRawPath = normalizedPath;
  const localBasePath = getLocalPublicPath(normalizedPath);
  return Array.from(new Set([primary, localRawPath, localBasePath]));
}

/**
 * Append the current deploy version to a URL so stale browser caches cannot
 * survive across releases while still allowing normal HTTP caching per release.
 */
export function withDeployVersion(url: string): string {
  if (!deployVersion) {
    return url
  }

  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "https://example.invalid"
  const parsedUrl = new URL(url, baseOrigin)
  parsedUrl.searchParams.set("v", deployVersion)

  if (/^https?:\/\//.test(url)) {
    return parsedUrl.toString()
  }

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
}

/**
 * Get a public asset URL with proper basePath handling
 * @param path - The path relative to /public (e.g., '/data/file.json')
 * @returns The full path including basePath if needed
 */
export function getPublicPath(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (normalizedPath.startsWith('/data/')) {
    return getDataPath(normalizedPath)
  }
  const basePath = getBasePath()
  return `${basePath}${normalizedPath}`
}

/**
 * Check if the application is running in development mode.
 * This is determined by checking if we're running on localhost.
 */
export function isDevMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}
