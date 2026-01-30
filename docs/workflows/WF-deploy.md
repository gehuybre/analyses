---
kind: workflow
id: WF-deploy
owner: Unknown
status: active
trigger: Push to main
inputs: []
outputs: []
entrypoints: []
files:
  - .github/workflows/nextjs.yml
last_reviewed: 2025-12-13
---

# Deploy

This workflow builds and deploys the Next.js site to GitHub Pages.

## Triggers

- Push to `main` branch.
- Manual dispatch.

## Steps

1. Checkout code.
2. Setup Node.js.
3. Install dependencies (using `--legacy-peer-deps`).
4. Build Next.js site (generates static export to `out/`).
5. Upload artifact.
6. Deploy to GitHub Pages.
