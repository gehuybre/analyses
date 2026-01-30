/**
 * Utility functions for handling paths with basePath support
 */

/**
 * Get the base path for the application.
 * In production (GitHub Pages), this is '/data-blog'
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
  return window.location.pathname.startsWith('/data-blog') ? '/data-blog' : '';
}

/**
 * Get the base URL for data files (can be an external GitHub Pages repo).
 * Falls back to the app base path when not configured.
 */
export function getDataBaseUrl(): string {
  const envUrl = typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_DATA_BASE_URL
    : undefined;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/+$/, '');
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
  return `${baseUrl}${normalizedPath}`;
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
