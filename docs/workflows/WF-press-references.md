---
kind: workflow
id: WF-press-references
name: Adding Press Release References
owner: Unknown
status: active
trigger: manual
inputs: [blog slug, search query]
outputs: [press_references.json, updated content.mdx]
entrypoints:
  - .github/press-format/scripts/format_press.py
files:
  - .github/press-format/scripts/format_press.py
  - embuild-analyses/analyses/<slug>/results/press_references.json
  - embuild-analyses/src/components/analyses/shared/PressReferences.tsx
  - embuild-analyses/src/lib/press-utils.ts
  - embuild-analyses/analyses/<slug>/content.mdx
last_reviewed: 2026-01-25
---

# Workflow: Adding Press Release References to Blog Posts

## Overview

Add press release citations to blog posts using the `press-format` skill and `PressReferences` component. This workflow enables you to search the emv-pers press release dataset and display relevant citations in your blog posts.

## Prerequisites

- emv-pers repository cloned to `~/pyprojects/emv-pers`
- Press data file available at `~/pyprojects/emv-pers/press.normalized.ndjson`
- Blog analysis exists at `embuild-analyses/analyses/<slug>/`

## Steps

### 1. Generate Press References

Run the press-format script to search and format press releases:

```bash
python3 .github/press-format/scripts/format_press.py \
  --query "vergunningen PFAS" \
  --slug "vergunningen-aanvragen" \
  --limit 5
```

**Parameters:**
- `--query`: Search query (supports phrases in quotes, `|` for OR)
- `--slug`: Blog analysis slug (must match directory name)
- `--limit`: Maximum number of results (default: 10)
- `--start-date`: Optional start date filter (YYYY-MM-DD)
- `--end-date`: Optional end date filter (YYYY-MM-DD)

**Output:**
- Creates `embuild-analyses/analyses/<slug>/results/press_references.json`
- Displays summary of results found

### 2. Add Component to MDX

Edit your blog's `content.mdx` file:

```mdx
---
title: Your Blog Title
date: 2025-01-19
summary: Your summary
tags: [tag1, tag2]
slug: your-slug
---

import { PressReferences } from "@/components/analyses/shared/PressReferences"

... blog content ...

<PressReferences slug="your-slug" />
```

**Optional Props:**

```mdx
<PressReferences
  slug="your-slug"
  title="Relevante persberichten"
  showYear={true}
  maxExcerptLength={150}
/>
```

- `title`: Custom section title (default: "Gerelateerde persberichten")
- `showYear`: Group by year (default: false)
- `maxExcerptLength`: Excerpt truncation length (default: 200)

### 3. Verify Output

Start the development server:

```bash
cd embuild-analyses && npm run dev
```

Navigate to your blog post (e.g., `/vergunningen-aanvragen`) and verify:
- Press references section appears
- Titles are clickable links
- Dates are formatted correctly (Dutch locale)
- Excerpts are displayed with quotes
- Links open in new tabs

### 4. Build for Production

Test the production build:

```bash
cd embuild-analyses && npm run build
```

Verify:
- No TypeScript errors
- No build warnings
- Static HTML includes press references

## Advanced Usage

### Date Filtering

Search for press releases within a specific date range:

```bash
python3 .github/press-format/scripts/format_press.py \
  --query "PFAS" \
  --slug "vergunningen-aanvragen" \
  --start-date 2025-01-01 \
  --end-date 2025-12-31
```

### Complex Queries

Use the OR operator to match multiple terms:

```bash
python3 .github/press-format/scripts/format_press.py \
  --query "vergunning|PFAS|bouwstop" \
  --slug "vergunningen-aanvragen" \
  --limit 10
```

Use quoted phrases for exact matches:

```bash
python3 .github/press-format/scripts/format_press.py \
  --query "tijdelijk handelingskader" \
  --slug "vergunningen-aanvragen"
```

### Year Grouping

Display references grouped by publication year:

```mdx
<PressReferences slug="vergunningen-aanvragen" showYear={true} />
```

## Files Involved

| File | Purpose |
|------|---------|
| `.github/press-format/scripts/format_press.py` | Main script for data generation |
| `embuild-analyses/analyses/<slug>/results/press_references.json` | Generated press reference data |
| `embuild-analyses/src/components/analyses/shared/PressReferences.tsx` | React component for display |
| `embuild-analyses/src/lib/press-utils.ts` | Utility functions |
| `embuild-analyses/analyses/<slug>/content.mdx` | Blog post with component import |

## Troubleshooting

### Error: Press search script not found

The emv-pers repository is not in the expected location. Ensure it's cloned to:
```
~/pyprojects/emv-pers/
```

### Error: Press data file not found

The press.normalized.ndjson file is missing. Pull the latest from emv-pers:
```bash
cd ~/pyprojects/emv-pers
git pull
```

### Warning: Press references not found

The component will gracefully return null if the JSON file doesn't exist. Generate it first:
```bash
python3 .github/press-format/scripts/format_press.py --query "your query" --slug "your-slug"
```

### No Results Found

Try broader search queries:
- Remove quotes for fuzzy matching
- Use OR operator: `term1|term2`
- Increase `--limit` parameter
- Remove date filters

## Example Workflows

### Example 1: Building Permits Blog

```bash
# Generate references
python3 .github/press-format/scripts/format_press.py \
  --query "vergunning bouwvergunning" \
  --slug "vergunningen-aanvragen" \
  --limit 8

# Edit content.mdx
# Add: <PressReferences slug="vergunningen-aanvragen" />

# Test
cd embuild-analyses && npm run dev
```

### Example 2: PFAS Topic with Date Filter

```bash
# Generate references for 2025 only
python3 .github/press-format/scripts/format_press.py \
  --query "PFAS" \
  --slug "vergunningen-aanvragen" \
  --start-date 2025-01-01 \
  --end-date 2025-12-31 \
  --limit 5

# Use with year grouping
# <PressReferences slug="vergunningen-aanvragen" showYear={true} />
```

### Example 3: Multiple Topics

```bash
# Search for multiple related topics
python3 .github/press-format/scripts/format_press.py \
  --query "vergunning|PFAS|bouwstop|handelingskader" \
  --slug "vergunningen-aanvragen" \
  --limit 15
```

## Best Practices

1. **Query Design**
   - Start broad, then refine if too many results
   - Use specific terms from your blog content
   - Test queries before adding to blog

2. **Result Limits**
   - Keep under 10 references for readability
   - Use year grouping for many results
   - Consider date filtering for focused results

3. **Content Integration**
   - Place references at end of blog post
   - Use custom titles that match blog context
   - Keep excerpts visible (don't truncate too much)

4. **Maintenance**
   - Regenerate references when press data updates
   - Update queries if blog content changes
   - Review references periodically for relevance

## Related Documentation

- [.github/press-format/SKILL.md](../../.github/press-format/SKILL.md) - Press format skill documentation
- [.github/press-ndjson-search/SKILL.md](../../.github/press-ndjson-search/SKILL.md) - Press search skill documentation
- [CLAUDE.md](../../CLAUDE.md) - Project documentation and component guide
