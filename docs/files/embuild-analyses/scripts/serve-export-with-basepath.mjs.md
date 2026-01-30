---
kind: file
path: embuild-analyses/scripts/serve-export-with-basepath.mjs
role: Development Server
workflows: []
inputs:
  - name: Static export files
    from: embuild-analyses/out/
    type: file
    schema: Next.js static export output
    required: true
outputs: []
interfaces:
  - HTTP server on localhost
stability: stable
owner: Unknown
safe_to_delete_when: When local testing of static exports is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/scripts/serve-export-with-basepath.mjs

## Role

Local development HTTP server for testing Next.js static exports with basePath configuration.

## Why it exists

GitHub Pages deploys the site to a subdirectory (/data-blog), which requires basePath configuration. This server simulates that environment locally, allowing developers to test static exports with correct paths before deployment.

## Used by workflows

None. This is a development utility for local testing.

## Inputs

Serves files from the `out/` directory (Next.js static export output). Respects BASE_PATH environment variable (defaults to /data-blog).

## Outputs

HTTP server on port 3000 (or PORT env var) serving static files with basePath routing.

## Interfaces

Node.js ES module server:
```bash
node embuild-analyses/scripts/serve-export-with-basepath.mjs
# Or with custom config:
BASE_PATH=/data-blog PORT=3000 OUT_DIR=out node embuild-analyses/scripts/serve-export-with-basepath.mjs
```

Features:
- BasePath routing
- Path traversal protection
- MIME type detection
- Directory index.html serving

## Ownership and lifecycle

Stability: Stable, useful development tool.
Safe to delete when: Local testing with basePath is no longer needed or handled by different tooling.
Superseded by: None.
