---
kind: file
path: scripts/library_audit.js
role: CLI helper / Audit script
workflows: []
inputs:
  - repo files
outputs:
  - out/library-audit.json
interfaces:
  - npm run library-audit (command)
stability: experimental
owner: Unknown
safe_to_delete_when: When script is removed or replaced
superseded_by: null
last_reviewed: 2026-01-25
---

# scripts/library_audit.js

Small heuristic tool to scan repository source files for functions longer than 10 effective lines and to suggest libraries that could replace custom logic (e.g., `date-fns`, `zod`, `lodash`, `p-limit`, `multer`).

Usage:

```
npm run library-audit
```

Output:
- `out/library-audit.json` (machine-readable) with findings: file, start/end lines, effective line count, and package suggestions.

Notes:
- Heuristic only: review results manually before refactoring.
- To fail CI when suggestions exist, run with `--fail-on-suggestions`.
