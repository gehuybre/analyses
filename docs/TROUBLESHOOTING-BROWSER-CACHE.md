# Troubleshooting: Aggressive Browser Caching in Next.js Development

## Problem

When making changes to React components in Next.js development mode, the browser may continue to show old code even after:
- Hard refresh (Cmd+Shift+R)
- Clearing browser cache
- Restarting the dev server
- Removing `.next` directory

This happens due to multiple layers of caching:
1. Browser HTTP cache
2. Service workers
3. Next.js webpack cache
4. Node.js module cache
5. Contentlayer cache (if using Contentlayer)

## Symptoms

- Code changes don't appear in the browser
- Console logs added to components don't show up
- Visual changes (colors, text) aren't reflected
- Build logs show "Compiled successfully" but browser shows old UI

## Nuclear Solution (Always Works)

```bash
cd embuild-analyses

# 1. Kill all Node/Next.js processes
pkill -9 -f "next dev"
pkill -9 node
sleep 2

# 2. Remove ALL cache directories
rm -rf .next
rm -rf node_modules/.cache
rm -rf .contentlayer

# 3. Restart dev server
npm run dev
```

**Note**: The dev server might start on a different port (e.g., 3001) if port 3000 is still occupied.

## Browser Steps (After Server Restart)

1. **Close ALL browser tabs/windows** with `localhost:3000` or `localhost:3001`
2. **Quit and reopen browser** (optional but recommended)
3. **Open in incognito/private window** (for testing)
4. Navigate to `http://localhost:3001/...` (check which port the server started on)

## Alternative: Force Code Reload Verification

Add a visible marker to verify new code is loading:

```tsx
// Temporary debug marker
<CardTitle className="text-red-500">🔴 NEW CODE LOADED - Component Name</CardTitle>
```

If you don't see this marker after the nuclear solution, the browser is still using cached code.

## Prevention

### During Development

1. **Keep DevTools open** with "Disable cache" checked (Network tab)
2. **Use incognito mode** for major UI changes
3. **Change port** if problems persist: `PORT=3002 npm run dev`

### For Production Testing

```bash
# Test production build locally
./test-production.sh
```

This script builds with the GitHub Pages basePath (`/data-blog`) and serves locally.

## Related Issues

### Webpack Cache Warning

You may see this warning (safe to ignore):

```
[webpack.cache.PackFileCacheStrategy] Parsing of .../generate-dotpkg.js 
for build dependencies failed...
Build dependencies behind this expression are ignored and might cause 
incorrect cache invalidation.
```

This is a known Contentlayer + webpack caching quirk and doesn't affect functionality.

### Port Already in Use

If you see `⚠ Port 3000 is in use, trying 3001 instead`, check which port started:

```bash
lsof -ti:3000
lsof -ti:3001
```

Kill processes if needed:

```bash
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:3001)
```

## When This Is Needed

- After adding new component files
- After modifying shared utilities (especially `labelUtils.ts`, `geo-utils.ts`)
- After changing data validation logic
- When console.logs don't appear despite being added
- When visual changes (colors, text) aren't reflected

## What NOT to Do

❌ Don't delete `node_modules` - this is overkill and requires `npm install`  
❌ Don't restart computer - the nuclear solution above is sufficient  
❌ Don't edit webpack config to disable caching - breaks HMR (Hot Module Replacement)

## Last Resort

If even the nuclear solution doesn't work:

```bash
cd embuild-analyses
rm -rf node_modules
npm install
npm run dev
```

Then close ALL browser windows and reopen in incognito mode.
