# Split Repo Migration Guide

## Overview

This project has been migrated from a monolithic setup to a **split repository system**:

- **Site Repository** (`gehuybre/analyses`): Contains Next.js site + analysis scripts
- **Data Repository** (`gehuybre/data`): Contains runtime JSON/CSV data files

## Why Split Repos?

The split was implemented to solve:
- **Large file sizes**: Analysis results (~700 JSON files) were causing slow deploys
- **Git LFS bandwidth**: Expensive bandwidth usage with Git LFS
- **Separation of concerns**: Site code and generated data have different update frequencies

## Architecture

### Data Loading Flow

```
User Browser
    ↓
Analysis Page (embuild-analyses/src/components/analyses/*)
    ↓
useJsonBundle() or custom data hook
    ↓
getDataPath("/analyses/{slug}/results/{file}.json")
    ↓
NEXT_PUBLIC_DATA_BASE_URL="https://gehuybre.github.io/data"
    ↓
https://gehuybre.github.io/data/analyses/{slug}/results/{file}.json
    ↓
Data Repository (gehuybre/data)
```

### Key Components

#### 1. **path-utils.ts** - Centralized URL construction
- `getDataBaseUrl()` - Returns base URL with fallback logic
- `getDataPath(path)` - Constructs full data URLs
- Respects `NEXT_PUBLIC_DATA_BASE_URL` environment variable

#### 2. **use-json-bundle.ts** - Parallel data loading
- React hook for loading multiple JSON files
- Uses `Promise.all()` for parallel requests
- Implements abort controller for cleanup
- Automatic error handling and loading states

#### 3. **Analysis-specific data hooks** - Custom loading per analysis
- Location: `src/components/analyses/{slug}/use-{slug}-data.ts`
- Each hook uses `useJsonBundle()` to load analysis data
- Example: `use-faillissementen-data.ts` loads bankruptcy data

#### 4. **embed-data-registry.ts** - Embed system support
- Central loader for embeddable analysis sections
- Caches loaded data to prevent redundant requests
- Supports both standard and custom embed configs

## Migration Checklist

Use the migration checker to verify all blogs are using the new system:

```bash
node scripts/check-data-migration.js
```

This checks:
- ✓ No direct imports from old result locations
- ✓ No `fs.readFileSync` on results
- ✓ No hardcoded embuild paths
- ✓ All data hooks use new system
- ✓ Path utilities are configured
- ✓ Environment variables set
- ✓ Analysis components properly migrated
- ✓ Old data files removed from public

## Cleanup: Removing Old Data Files

### Issue
The `embuild-analyses/public/` directory still contains 1229 old files from before the split:
- Analysis results (`.json` files)
- Map data (GeoJSON)
- Press references

Since all data is now served from the data repo, these files should be removed to:
- Reduce site build size
- Avoid confusion with new system
- Prevent accidental loading from wrong sources

### Solution

The `export_data_repo.py` script has a `--clean` flag that removes stale data:

```bash
cd analyses
python3 scripts/export_data_repo.py --clean
```

This will:
1. Export current data to the data repo
2. Remove any files in the data repo that are no longer produced
3. Keep the public directory in sync

But to clean the **analyses repo** itself, remove these directories:

```bash
# In embuild-analyses directory
rm -rf public/analyses
rm -rf public/data
rm -rf public/maps
rm -rf public/press-references
```

Or use the cleanup script:

```bash
# In embuild-analyses directory
find public -path "*analyses*" -type f -name "*.json" -delete
find public -path "*press-references*" -type f -name "*.json" -delete
find public -name "belgium_*.json" -delete
```

Then commit the cleanup:

```bash
git add public/
git commit -m "Remove old data files - now served from data repo"
```

## How to Add a New Analysis

When creating a new analysis that uses the new split repo system:

### 1. Create analysis script
- File: `embuild-analyses/analyses/{slug}/...`
- Output results to: `embuild-analyses/analyses/{slug}/results/*.json`

### 2. Create data hook
```typescript
// src/components/analyses/{slug}/use-{slug}-data.ts
import { useJsonBundle } from '@/lib/use-json-bundle'
import { getDataPath } from '@/lib/path-utils'

export function use{CamelCaseSlug}Data() {
  return useJsonBundle({
    yearly: getDataPath('/analyses/{slug}/results/yearly.json'),
    monthly: getDataPath('/analyses/{slug}/results/monthly.json'),
    // ... other files
  })
}
```

### 3. Create component
```typescript
// src/components/analyses/{slug}/{CamelCaseSlug}Embed.tsx
export function {CamelCaseSlug}Embed() {
  const { data, loading, error } = use{CamelCaseSlug}Data()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{/* render data */}</div>
}
```

### 4. Export data to data repo

After running the analysis:

```bash
cd analyses
python3 scripts/export_data_repo.py --clean
cd ../data
git add analyses/{slug}/
git commit -m "Add {slug} analysis data"
git push origin main
```

GitHub Pages will automatically deploy the data.

### 5. Register in embed config (if embeddable)

Add to `src/lib/embed-config.ts`:

```typescript
{
  type: 'custom',
  title: 'Analysis Title',
  component: '{CamelCaseSlug}Embed',
  height: 600,
}
```

## Environment Variables

### NEXT_PUBLIC_DATA_BASE_URL
- **Purpose**: Base URL for data repository
- **Development**: `http://localhost:3000` (uses local public files for demo)
- **Staging/Production**: `https://gehuybre.github.io/data`
- **Location**: `.env.local` or GitHub Actions secrets

Set in:
- `.env.local` (local development)
- `.env.example` (documentation)
- GitHub Actions workflow (CI/CD)

### NEXT_PUBLIC_BASE_PATH
- **Purpose**: Base path for application
- **Default**: `''` (root)
- **Alternative**: `'/analyses'` (if served under subdomain)

## Debugging

### URLs still returning 404?

1. **Check GitHub Pages deployment**: Visit `https://gehuybre.github.io/data/`
2. **Verify data file exists**: `git ls-tree HEAD -- analyses/{slug}/results/`
3. **Check environment variable**: Verify `NEXT_PUBLIC_DATA_BASE_URL` is set
4. **Test direct URL**: Try accessing the file directly in browser
5. **Clear cache**: Hard refresh or open in incognito mode

### Data not loading in browser?

1. **Open DevTools** → Network tab
2. **Look for failed requests** to `https://gehuybre.github.io/data/...`
3. **Check for CORS errors** (shouldn't happen with GitHub Pages)
4. **Verify browser shows correct loading state**

### Component using wrong data?

1. **Check the data hook**: Verify paths in `use-{slug}-data.ts`
2. **Verify getDataPath usage**: Should prefix all paths with `/`
3. **Check for hardcoded paths**: Search for `/analyses/` in components
4. **Run migration checker**: `node scripts/check-data-migration.js`

## Testing

### Run migration checker
```bash
node scripts/check-data-migration.js
```

### Run unit tests
```bash
npm test
```

### Test data loading
```bash
# In browser console
fetch('https://gehuybre.github.io/data/analyses/faillissementen/results/monthly_construction.json')
  .then(r => r.json())
  .then(data => console.log(data))
```

## References

- [README.md](../README.md) - Project overview
- [GIT-LFS.md](./GIT-LFS.md) - Previous Git LFS setup
- [Data Repo](https://github.com/gehuybre/data) - External data repository
- [Next.js Docs](https://nextjs.org) - Next.js framework
