---
kind: file
path: embuild-analyses/contentlayer.config.ts
role: Configuration
workflows:
  - WF-project-setup
inputs: []
last_reviewed: 2026-01-17
---

# contentlayer.config.ts

Configuration for Contentlayer. Defines the `Analysis` document type and source directory.

It is configured to look for MDX files in the `analyses` directory. Each analysis is expected to be in its own subdirectory (e.g., `analyses/my-analysis/content.mdx`).

Note: The `exclude` property was removed as it is not supported in the current version.
