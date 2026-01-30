---
kind: workflow
id: WF-project-setup
owner: Unknown
status: active
trigger: Manual
inputs: []
outputs: []
entrypoints: []
files:
  - embuild-analyses/package.json
  - embuild-analyses/contentlayer.config.ts
  - embuild-analyses/next.config.mjs
  - run_blog.py
  - requirements.txt
last_reviewed: 2026-01-17
---

# Project Setup

This workflow describes the initial setup of the Next.js project with shadcn/ui and Contentlayer.

## Steps

1. Initialize Next.js app.
2. Initialize shadcn/ui.
3. Configure Contentlayer for MDX.
4. Create overview and detail pages.
5. Set up Python virtual environment and requirements.
