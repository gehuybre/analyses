---
kind: file
path: embuild-analyses/analyses/bouwprojecten-gemeenten/src/category_keywords.py
role: Unknown
workflows: []
inputs: []
outputs: []
interfaces: []
stability: experimental
owner: Unknown
safe_to_delete_when: Unknown
superseded_by: null
last_reviewed: 2026-01-17
---

# File: embuild-analyses/analyses/bouwprojecten-gemeenten/src/category_keywords.py

Defines `CATEGORY_DEFINITIONS` used to classify projects into categories such as `wegenbouw`, `groen`, `zorg`, `riolering`, `cultuur`, `sport`, `scholenbouw`, `verlichting`, `ruimtelijke-ordening`, `gebouwen` and the fallback `overige`.

Key functions:
- `classify_project(ac_short, ac_long)` — returns a list of category IDs that matched the project text (keyword search, case-insensitive)
- `get_category_label(category_id)` — helper for display. (Emoji support removed)
- `summarize_projects_by_category(projects, top_n=5)` — aggregate investments per category and return, for each category, the project count, total amount and the largest projects (including per-project amounts and yearly breakdowns).
- `get_category_investment_summary(projects, category_id, top_n=5)` — convenience wrapper returning the summary for a single category.

Notes:
- The classification is simple keyword-matching and may yield multiple categories per project; review the keywords list in `CATEGORY_DEFINITIONS` to tune precision/recall.
