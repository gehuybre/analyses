import { describe, it, expect } from 'vitest';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

/**
 * Test suite to verify migration from old data locations to new split repo system
 *
 * Old system: Data files embedded in analyses repo at embuild-analyses/analyses/*/results/
 * New system: Data files fetched from external data repo at https://gehuybre.github.io/data/
 */

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ANALYSES_ROOT = path.resolve(PROJECT_ROOT, 'analyses/embuild-analyses');

// Patterns that indicate old data loading (should NOT exist)
const OLD_DATA_PATTERNS = [
  // Direct imports from results directories
  /import\s+.*from\s+['"].*\/analyses\/\w+\/results\/.*\.json['\"]/,
  // Relative path requires to results files
  /require\(['"].*\/analyses\/\w+\/results\/.*\.json['"]\)/,
  // Hardcoded file system paths to results
  /fs\.readFileSync\(['"].*\/analyses\/\w+\/results\/.*\.json['"]/,
  // Old embuild analysis paths
  /embuild-analyses\/analyses\/\w+\/results\//,
  // Public path references to results (old system)
  /\/public\/analyses\/\w+\/results\//,
];

// Patterns that indicate new data loading (SHOULD exist for data fetching)
const NEW_DATA_PATTERNS = [
  // useJsonBundle hook
  /useJsonBundle/,
  // useEmbedData hook
  /useEmbedData/,
  // getDataPath function
  /getDataPath\(/,
  // getDataBaseUrl function
  /getDataBaseUrl\(/,
  // NEXT_PUBLIC_DATA_BASE_URL environment variable
  /NEXT_PUBLIC_DATA_BASE_URL/,
  // Data URLs with /analyses/ path
  /['"`]\/analyses\/\w+\/results\/.*\.json['"`]/,
];

describe('Data Migration: Old vs New System', () => {
  let sourceFiles: string[] = [];

  beforeAll(async () => {
    // Find all TypeScript/JavaScript files (excluding node_modules and .next)
    sourceFiles = await glob(`${ANALYSES_ROOT}/src/**/*.{ts,tsx,js,jsx}`, {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    });
  });

  describe('No old data loading patterns', () => {
    it('should not have direct imports from analyses results directories', () => {
      const offendingFiles: { file: string; matches: string[] }[] = [];

      sourceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(
          /import\s+.*from\s+['"].*\/analyses\/\w+\/results\/.*\.json['"]/g
        );

        if (matches) {
          offendingFiles.push({
            file: path.relative(PROJECT_ROOT, file),
            matches,
          });
        }
      });

      expect(
        offendingFiles,
        `Found direct imports from results directories. Use useJsonBundle() or getDataPath() instead:\n${JSON.stringify(
          offendingFiles,
          null,
          2
        )}`
      ).toHaveLength(0);
    });

    it('should not have fs.readFileSync for results files', () => {
      const offendingFiles: { file: string; matches: string[] }[] = [];

      sourceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(/fs\.readFileSync\([^)]*\/analyses\/\w+\/results\/[^)]*\)/g);

        if (matches) {
          offendingFiles.push({
            file: path.relative(PROJECT_ROOT, file),
            matches,
          });
        }
      });

      expect(
        offendingFiles,
        `Found fs.readFileSync for results files. Use useJsonBundle() or API routes instead:\n${JSON.stringify(
          offendingFiles,
          null,
          2
        )}`
      ).toHaveLength(0);
    });

    it('should not have embuild-analyses/analyses paths hardcoded', () => {
      const offendingFiles: { file: string; matches: string[] }[] = [];

      sourceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const matches = content.match(/embuild-analyses\/analyses\/\w+\/results\//g);

        if (matches) {
          offendingFiles.push({
            file: path.relative(PROJECT_ROOT, file),
            matches,
          });
        }
      });

      expect(
        offendingFiles,
        `Found hardcoded embuild-analyses paths:\n${JSON.stringify(offendingFiles, null, 2)}`
      ).toHaveLength(0);
    });
  });

  describe('Using new data loading system', () => {
    it('components that load analyses data should use useJsonBundle or useEmbedData', () => {
      // Find all custom hook files for analyses
      const analysisHookFiles = sourceFiles.filter((file) =>
        /use-\w+-data|embed.*hook/i.test(path.basename(file))
      );

      expect(
        analysisHookFiles.length,
        'Should find custom data hooks for analyses'
      ).toBeGreaterThan(0);

      const hookFilesUsingNewSystem: string[] = [];

      analysisHookFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('useJsonBundle') || content.includes('useEmbedData')) {
          hookFilesUsingNewSystem.push(path.relative(PROJECT_ROOT, file));
        }
      });

      expect(
        hookFilesUsingNewSystem.length,
        `All data hooks should use new system. Missing: ${analysisHookFiles
          .filter((f) => !hookFilesUsingNewSystem.includes(path.relative(PROJECT_ROOT, f)))
          .map((f) => path.relative(PROJECT_ROOT, f))
          .join(', ')}`
      ).toBe(analysisHookFiles.length);
    });

    it('all /analyses/ paths should be data URLs with /analyses prefix', () => {
      const filesThatLoadAnalysisData: string[] = [];

      sourceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Check if file references analyses paths
        if (/['"`]\/analyses\/\w+\/results\//g.test(content)) {
          filesThatLoadAnalysisData.push(path.relative(PROJECT_ROOT, file));
        }
      });

      // All files that reference /analyses/ paths should be using data loading infrastructure
      const invalidFiles = filesThatLoadAnalysisData.filter((file) => {
        const content = fs.readFileSync(path.resolve(PROJECT_ROOT, file), 'utf-8');
        // Check if they also have proper data loading
        const hasDataLoading =
          content.includes('useJsonBundle') ||
          content.includes('useEmbedData') ||
          content.includes('getDataPath') ||
          content.includes('getDataBaseUrl') ||
          content.includes('NEXT_PUBLIC_DATA_BASE_URL') ||
          content.includes('/api/') ||
          /fetch\(.*\/analyses\//g.test(content);

        return !hasDataLoading;
      });

      expect(
        invalidFiles,
        `Files referencing /analyses/ paths must use proper data loading:\n${invalidFiles.join(
          '\n'
        )}`
      ).toHaveLength(0);
    });
  });

  describe('Data loading utilities are correctly used', () => {
    it('should find getDataPath usage in path-utils', () => {
      const pathUtilsFile = path.resolve(ANALYSES_ROOT, 'src/lib/path-utils.ts');
      const content = fs.readFileSync(pathUtilsFile, 'utf-8');

      expect(content).toContain('getDataPath');
      expect(content).toContain('getDataBaseUrl');
      expect(content).toContain('NEXT_PUBLIC_DATA_BASE_URL');
    });

    it('should find useJsonBundle hook for parallel data loading', () => {
      const useJsonBundleFile = path.resolve(
        ANALYSES_ROOT,
        'src/lib/use-json-bundle.ts'
      );

      expect(
        fs.existsSync(useJsonBundleFile),
        'useJsonBundle hook should exist for loading multiple JSON files'
      ).toBe(true);

      const content = fs.readFileSync(useJsonBundleFile, 'utf-8');
      expect(content).toContain('getDataPath');
      expect(content).toContain('Promise.all');
    });
  });

  describe('Each analysis uses correct data loading', () => {
    const analysisComponentsPath = path.resolve(ANALYSES_ROOT, 'src/components/analyses');

    it('should have data hooks for each analysis', async () => {
      if (!fs.existsSync(analysisComponentsPath)) {
        return;
      }

      const analysisDirectories = fs
        .readdirSync(analysisComponentsPath)
        .filter((f) =>
          fs.statSync(path.join(analysisComponentsPath, f)).isDirectory()
        );

      expect(analysisDirectories.length).toBeGreaterThan(0);

      analysisDirectories.forEach((analysisDirName) => {
        const analysisDirPath = path.join(analysisComponentsPath, analysisDirName);
        const hookFile = path.join(analysisDirPath, `use-${analysisDirName}-data.ts`);
        const embedComponentFile = path.join(analysisDirPath, `${analysisDirName}Embed.tsx`);

        // Either should have a custom hook or embed component
        const hasHookOrComponent =
          fs.existsSync(hookFile) || fs.existsSync(embedComponentFile);

        expect(
          hasHookOrComponent,
          `Analysis "${analysisDirName}" should have either use-*-data.ts hook or *Embed.tsx component`
        ).toBe(true);

        // If hook exists, verify it uses new system
        if (fs.existsSync(hookFile)) {
          const hookContent = fs.readFileSync(hookFile, 'utf-8');
          expect(
            hookContent.includes('useJsonBundle') || hookContent.includes('getDataPath'),
            `Hook for "${analysisDirName}" should use useJsonBundle or getDataPath`
          ).toBe(true);
        }

        // If component exists, verify it uses new system
        if (fs.existsSync(embedComponentFile)) {
          const componentContent = fs.readFileSync(embedComponentFile, 'utf-8');
          expect(
            componentContent.includes('useJsonBundle') ||
              componentContent.includes('useEmbedData') ||
              componentContent.includes('getDataPath') ||
              /fetch\(.*data.*\)/g.test(componentContent),
            `Component for "${analysisDirName}" should use new data loading system`
          ).toBe(true);
        }
      });
    });
  });

  describe('Environment variable configuration', () => {
    it('should have NEXT_PUBLIC_DATA_BASE_URL in layout', () => {
      const layoutFile = path.resolve(
        ANALYSES_ROOT,
        'src/app/layout.tsx'
      );

      if (fs.existsSync(layoutFile)) {
        const content = fs.readFileSync(layoutFile, 'utf-8');
        expect(
          content.includes('NEXT_PUBLIC_DATA_BASE_URL'),
          'Layout should reference NEXT_PUBLIC_DATA_BASE_URL for data loading'
        ).toBe(true);
      }
    });

    it('.env.local should have NEXT_PUBLIC_DATA_BASE_URL set', () => {
      const envFile = path.resolve(ANALYSES_ROOT, '.env.local');

      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf-8');
        expect(
          content.includes('NEXT_PUBLIC_DATA_BASE_URL'),
          '.env.local should configure NEXT_PUBLIC_DATA_BASE_URL'
        ).toBe(true);
      }
    });
  });

  describe('No data files in public directory for results', () => {
    it('should not have analysis results copied to public directory', () => {
      const publicAnalysesPath = path.resolve(ANALYSES_ROOT, 'public/analyses');

      if (fs.existsSync(publicAnalysesPath)) {
        const resultsFiles = require('child_process')
          .execSync(`find "${publicAnalysesPath}" -name "*.json" -type f`, {
            encoding: 'utf-8',
          })
          .trim()
          .split('\n')
          .filter((f: string) => f.length > 0);

        expect(
          resultsFiles,
          `Results JSON files should not be in public/analyses. Found: ${resultsFiles.join(
            ', '
          )}`
        ).toHaveLength(0);
      }
    });
  });
});

describe('Data Migration Checklist', () => {
  it('should have documentation on the split repo setup', () => {
    const readmeFile = path.resolve(PROJECT_ROOT, 'README.md');
    const content = fs.readFileSync(readmeFile, 'utf-8');

    expect(
      content.includes('split') || content.includes('data repo'),
      'README should document the split repo setup'
    ).toBe(true);
  });

  it('should provide migration guidance in docs', () => {
    const docsPath = path.resolve(ANALYSES_ROOT, 'docs');

    if (fs.existsSync(docsPath)) {
      const files = require('child_process')
        .execSync(`find "${docsPath}" -name "*.md" -type f`, {
          encoding: 'utf-8',
        })
        .trim()
        .split('\n');

      expect(
        files.length,
        'Should have documentation files explaining the migration'
      ).toBeGreaterThan(0);
    }
  });
});
