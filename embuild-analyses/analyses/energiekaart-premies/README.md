# Energiekaart Premies Data Extraction

This directory contains the data extraction script for energy subsidies (energiepremies) from the Flemish government's Energiekaart PowerBI dashboard.

## Overview

The script extracts data from the PowerBI dashboard at:
https://apps.energiesparen.be/energiekaart/vlaanderen/premies-res-tijdreeks-algemeen

## Files

- `src/download-data.mjs` - Node.js script using Playwright to extract data from PowerBI
- `results/` - Output directory for extracted CSV files and metadata
- `data/` - Reserved for any manual data files
- `update-energiekaart-premies-data.yml` - GitHub Actions workflow (needs to be moved to `.github/workflows/`)

## Usage

### Manual Execution

```bash
# From the repository root
cd embuild-analyses

# Install dependencies (if not already done)
npm install

# Install Playwright browser
npx playwright install chromium --with-deps

# Run the extraction script
node analyses/energiekaart-premies/src/download-data.mjs
```

### Environment Variables

- `SOURCE_URL` - PowerBI dashboard URL (default: energiekaart premies URL)
- `OUT_DIR` - Output directory (default: `embuild-analyses/analyses/energiekaart-premies/results`)
- `TIMEOUT_MS` - Timeout in milliseconds (default: 180000)
- `DEBUG` - Enable debug logging (set to "1" or "true")

### GitHub Actions Setup

To enable automated data updates:

1. Move the workflow file to the correct location:
   ```bash
   mv embuild-analyses/analyses/energiekaart-premies/update-energiekaart-premies-data.yml .github/workflows/
   ```

2. Commit and push:
   ```bash
   git add .github/workflows/update-energiekaart-premies-data.yml
   git commit -m "chore: enable energiekaart-premies automated updates"
   git push
   ```

The workflow will:
- Run daily at 02:00 UTC
- Can be triggered manually via workflow_dispatch
- Extract fresh data from the PowerBI dashboard
- Commit and push changes if data has changed

## Output

The script generates:
- Multiple CSV files with data from PowerBI matrix/pivot tables
- `metadata.json` - Contains information about extracted files, PowerBI pages, and bookmarks

Expected output files:
- `premies-res-tijdreeks-algemeen__default__Algemene Totalen__pivottable__Matrix__Aantal.csv`
- `premies-res-tijdreeks-algemeen__default__Algemene Totalen__pivottable__Matrix__Totaal bedrag.csv`

## How It Works

1. Launches headless Chromium browser via Playwright
2. Navigates to the PowerBI dashboard
3. Waits for PowerBI embed to load
4. Discovers all pages and visual elements (tables, matrices, pivot tables)
5. Exports data from each visual using PowerBI's exportData API
6. Saves CSV files with descriptive filenames
7. Generates metadata file with extraction details
