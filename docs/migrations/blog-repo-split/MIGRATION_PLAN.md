# Migration Plan: Split Blogs Into Separate Repo

## Goal
Move blog content and data sources into a dedicated blogs repo, keeping this repo as a hub for title pages and links.

## Scope
- In scope: blog content, data sources, build pipelines per blog.
- Out of scope: global analytics refactors, shared UI overhaul.

## Phase 0 - Inventory (1-2 days)
**Entry criteria**: decision to split is approved.
**Tasks**
- List all current blogs and their data sources.
- Identify shared assets/templates.
- Record build steps and runtime per blog.
**Exit criteria**
- Inventory list complete.
- Each blog has a clear build recipe.

## Phase 1 - Hub hardening (1 day)
**Tasks**
- Add `data/blogs.json` manifest in hub.
- Add a validator script + CI workflow.
- Update title pages to use manifest or to link directly.
**Exit criteria**
- CI fails on invalid manifest.
- Hub renders all title pages with correct links.

## Phase 2 - New blogs repo scaffold (1 day)
**Tasks**
- Create new repo with per-blog folders.
- Add `blog.json` metadata per blog.
- Add build workflow per blog.
**Exit criteria**
- New repo can build at least one empty blog folder.

## Phase 3 - Pilot migration (1-2 days)
**Tasks**
- Move a low-risk blog first.
- Validate build output and deployment.
- Update hub manifest link.
**Exit criteria**
- Pilot blog builds and is accessible via hub link.

## Phase 4 - Bulk migration (parallel)
**Tasks**
- Migrate remaining blogs in order of complexity.
- Record progress in MIGRATION_STATUS.md.
- Keep hub links current.
**Exit criteria**
- All active blogs moved and accessible.

## Phase 5 - Cleanup (0.5-1 day)
**Tasks**
- Remove migrated assets from hub repo.
- Archive old data sources if needed.
- Update documentation and ownership.
**Exit criteria**
- Hub repo contains only hub concerns.

## Risks and Mitigations
- Shared assets diverge: use a small shared package or copy with clear ownership.
- Link rot: add CI link checks in the hub.
- Build drift: pin runtime versions per blog.

## Definition of Done
- All blogs live in the new repo.
- Hub builds fast and references only external blog URLs.
- CI validates the manifest and links.
