#!/usr/bin/env node
/**
 * Build-time validation script for embed configuration paths
 *
 * This script validates that all data paths referenced in EMBED_CONFIGS
 * point to existing files, catching typos and missing files at build time
 * instead of runtime.
 *
 * Uses tsx to directly import the TypeScript config for robust parsing.
 * The actual validation logic is in validate-embed-paths.ts for better
 * maintainability and testability.
 */

const { spawn } = require('child_process');
const path = require('path');

const validatorScript = path.join(__dirname, 'validate-embed-paths.ts');

// Run with tsx
const tsx = spawn('npx', ['tsx', validatorScript], {
  stdio: 'inherit',
  shell: true,
});

tsx.on('close', (code) => {
  process.exit(code);
});

tsx.on('error', (err) => {
  console.error('❌ Failed to run tsx:', err);
  console.error('\n💡 Make sure tsx is installed:');
  console.error('   npm install -D tsx\n');
  process.exit(1);
});
