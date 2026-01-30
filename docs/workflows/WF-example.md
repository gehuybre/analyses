---
kind: workflow
id: WF-example
owner: Unknown
status: experimental
trigger: manual
inputs: []
outputs: []
entrypoints: []
files:
  - src/cli/main.py
last_reviewed: 2026-01-17
---

# WF: Documentation Example

## Purpose
Provide an example of documenting a change that introduces or modifies an entrypoint in the repo and the required docs to add or update.

## Trigger
Manual (documentation PR)

## Inputs
- A code change that adds or modifies an entrypoint, script, workflow, config, or data IO.

## Outputs
- Updated/added workflow doc under `docs/workflows/`
- Updated/added file docs under `docs/files/`
- Updated `docs/INDEX.md`

## Steps (high level)
- Identify changed entrypoints and affected files
- Create or update `docs/workflows/WF-<slug>.md` as needed
- Create or update `docs/files/<repo-path>.md` for any new or modified repo files
- Update `docs/INDEX.md` to include new workflows and key entrypoints
- Add documentation checklist to PR body and set `last_reviewed` fields

## Files involved
- src/cli/main.py
- docs/workflows/WF-example.md
- docs/files/src/cli/main.py.md