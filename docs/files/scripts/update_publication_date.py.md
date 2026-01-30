---
kind: file
path: scripts/update_publication_date.py
role: Utility Script
workflows: []
inputs:
  - name: Statbel webpage HTML
    from: External URL (Statbel website)
    type: html
    schema: Statbel data publication page
    required: true
  - name: content.mdx
    from: embuild-analyses/analyses/<slug>/content.mdx
    type: mdx
    schema: Analysis MDX file with frontmatter
    required: true
outputs:
  - name: Updated content.mdx
    to: embuild-analyses/analyses/<slug>/content.mdx
    type: mdx
    schema: MDX file with updated sourcePublicationDate
interfaces:
  - Command line script
stability: stable
owner: Unknown
safe_to_delete_when: When automated publication date tracking is no longer needed
superseded_by: null
last_reviewed: 2026-01-05
---

# File: scripts/update_publication_date.py

## Role

Python script that scrapes publication dates from Statbel web pages and updates MDX frontmatter in analysis files.

## Why it exists

Automates the process of keeping analysis publication dates in sync with source data updates. Scrapes Dutch-format dates from Statbel pages and updates the `sourcePublicationDate` field in analysis content files.

## Used by workflows

None. This is a utility script run manually when updating analyses with new data.

## Inputs

- Command line arguments: analysis slug and Statbel URL
- Statbel webpage HTML (scraped)
- Analysis MDX file to update

## Outputs

Updated MDX file with `sourcePublicationDate` field set to scraped date in ISO format (YYYY-MM-DD).

## Interfaces

Command line script:
```bash
python scripts/update_publication_date.py <analysis_slug> <statbel_url>
```

Example:
```bash
python scripts/update_publication_date.py starters-stoppers https://statbel.fgov.be/nl/themas/...
```

## Ownership and lifecycle

Stability: Stable, useful utility for data maintenance.
Safe to delete when: Manual date updates are preferred or automated sync is implemented differently.
Superseded by: None.
