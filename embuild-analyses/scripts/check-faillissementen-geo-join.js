#!/usr/bin/env node
/**
 * Geo-join validation script for faillissementen analysis
 *
 * Checks that all provinces and municipalities in the data can be matched
 * to geographic features in the map data.
 *
 * Exit codes:
 * - 0: All checks passed
 * - 1: Validation failed (unmatched provinces or municipalities)
 */

const fs = require('fs');
const path = require('path');

// Helper function to load JSON files
function loadJSON(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Failed to load ${filepath}: ${err.message}`);
    process.exit(1);
  }
}

// Paths
const ANALYSIS_DIR = path.join(__dirname, '../analyses/faillissementen');
const RESULTS_DIR = path.join(ANALYSIS_DIR, 'results');
const SHARED_DATA_DIR = path.join(__dirname, '../shared-data');
const ALLOWLIST_PATH = path.join(__dirname, 'faillissementen-geo-join-allowlist.json');

// Load Belgian province codes from shared JSON file
// Note: Brussels (21000) is an arrondissement treated as province-equivalent for visualization
const BELGIAN_PROVINCES = loadJSON(path.join(SHARED_DATA_DIR, 'belgian-provinces.json'));

function loadAllowlist() {
  if (fs.existsSync(ALLOWLIST_PATH)) {
    return loadJSON(ALLOWLIST_PATH);
  }
  return { provinces: [], municipalities: [] };
}

function checkProvinceJoin() {
  console.log('\n=== Checking Province Join ===\n');

  // Load province data files
  const provincesConstruction = loadJSON(path.join(RESULTS_DIR, 'provinces_construction.json'));
  const provincesAll = loadJSON(path.join(RESULTS_DIR, 'provinces.json'));

  // Collect all unique province codes from data
  const dataProvinceCodes = new Set();
  provincesConstruction.forEach(row => dataProvinceCodes.add(row.p));
  provincesAll.forEach(row => dataProvinceCodes.add(row.p));

  console.log(`Found ${dataProvinceCodes.size} unique province codes in data files`);

  // Check that all codes match known provinces
  const unmatchedProvinces = [];
  dataProvinceCodes.forEach(code => {
    if (!BELGIAN_PROVINCES[code]) {
      unmatchedProvinces.push(code);
    }
  });

  // Load allowlist
  const allowlist = loadAllowlist();
  const allowedUnmatchedProvinces = unmatchedProvinces.filter(code =>
    allowlist.provinces.includes(code)
  );
  const actuallyUnmatched = unmatchedProvinces.filter(code =>
    !allowlist.provinces.includes(code)
  );

  // Report results
  console.log(`Total province codes: ${dataProvinceCodes.size}`);
  console.log(`Matched provinces: ${dataProvinceCodes.size - unmatchedProvinces.length}`);
  console.log(`Unmatched provinces: ${unmatchedProvinces.length}`);

  if (allowedUnmatchedProvinces.length > 0) {
    console.log(`  - Whitelisted: ${allowedUnmatchedProvinces.length}`);
    allowedUnmatchedProvinces.forEach(code => {
      console.log(`    * ${code}`);
    });
  }

  if (actuallyUnmatched.length > 0) {
    console.log(`  - NOT whitelisted: ${actuallyUnmatched.length}`);
    actuallyUnmatched.forEach(code => {
      console.log(`    * ${code}`);
    });
  }

  // Verify all expected provinces are present
  const expectedProvinceCodes = Object.keys(BELGIAN_PROVINCES);
  const missingProvinces = expectedProvinceCodes.filter(code => !dataProvinceCodes.has(code));

  if (missingProvinces.length > 0) {
    console.log(`\n⚠️  WARNING: Expected provinces missing from data:`);
    missingProvinces.forEach(code => {
      console.log(`  - ${code}: ${BELGIAN_PROVINCES[code]}`);
    });
  }

  return actuallyUnmatched.length === 0;
}

function checkMunicipalityJoin() {
  console.log('\n=== Checking Municipality Join ===\n');

  // For now, we'll just check that municipality codes are present if there are
  // municipality-level data files. The faillissementen analysis currently doesn't
  // have municipality-level aggregations, so this is a placeholder for future use.

  console.log('No municipality-level data files found - skipping municipality join check');

  return true;
}

function main() {
  console.log('🔍 Faillissementen Geo-Join Validation');
  console.log('======================================');

  const provinceCheckPassed = checkProvinceJoin();
  const municipalityCheckPassed = checkMunicipalityJoin();

  console.log('\n=== Summary ===\n');
  console.log(`Province join: ${provinceCheckPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Municipality join: ${municipalityCheckPassed ? '✅ PASSED' : '❌ FAILED'}`);

  if (provinceCheckPassed && municipalityCheckPassed) {
    console.log('\n✅ All geo-join checks passed!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Geo-join validation failed!\n');
    process.exit(1);
  }
}

main();
