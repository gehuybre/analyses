---
kind: file
path: embuild-analyses/package.json
role: Configuration
workflows:
  - WF-project-setup
inputs: []
last_reviewed: 2026-01-17
---

# package.json

Defines the project dependencies and scripts.

## Scripts

- `dev`: Runs the development server using Webpack (`next dev --webpack`). This is required because `next-contentlayer` relies on Webpack plugins and is not yet fully compatible with Turbopack (default in Next.js 16).
- `build`: Builds the application for production.
- `start`: Starts the production server.
- `lint`: Runs ESLint.
