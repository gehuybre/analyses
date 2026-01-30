/**
 * Validation logic for embed configuration paths
 *
 * This module exports validation functions that can be used by the build script.
 * Separated into its own file for better maintainability and testability.
 */

import { EMBED_CONFIGS } from "../src/lib/embed-config"
import { hasEmbedData } from "../src/lib/embed-data-registry"
import { validateEmbedPath } from "../src/lib/embed-path-validation"
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const analysesDir = path.join(__dirname, '../analyses')

/**
 * Validate all embed configurations
 * @returns {{ errors: string[], warnings: string[], validatedCount: number }}
 */
export function validateEmbedConfigs() {
  const errors: string[] = []
  const warnings: string[] = []
  let validatedCount = 0
  const externalDataBase = Boolean(process.env.NEXT_PUBLIC_DATA_BASE_URL)

  console.log('🔍 Validating embed configuration...\n')

  for (const analysis of EMBED_CONFIGS) {
    for (const [sectionId, config] of Object.entries(analysis.sections)) {
      if (config.type === 'standard') {
        // Validate data path
        const dataPath = config.dataPath
        const fullDataPath = path.join(analysesDir, dataPath)

        if (!fs.existsSync(fullDataPath)) {
          const message = `❌ [${analysis.slug}/${sectionId}] Data file not found: ${dataPath}`
          if (externalDataBase) {
            warnings.push(`${message} (skipped: external data base configured)`)
          } else {
            errors.push(message)
          }
        } else {
          console.log(`✅ ${dataPath}`)
          validatedCount++
        }

        // Validate municipalities path
        const municipalitiesPath = config.municipalitiesPath
        const fullMunicipalitiesPath = path.join(analysesDir, municipalitiesPath)

        if (!fs.existsSync(fullMunicipalitiesPath)) {
          const message = `❌ [${analysis.slug}/${sectionId}] Municipalities file not found: ${municipalitiesPath}`
          if (externalDataBase) {
            warnings.push(`${message} (skipped: external data base configured)`)
          } else {
            errors.push(message)
          }
        } else {
          console.log(`✅ ${municipalitiesPath}`)
          validatedCount++
        }

        // Validate paths using shared validation module
        const dataPathValidation = validateEmbedPath(dataPath, 'dataPath', analysis.slug)
        if (!dataPathValidation.valid) {
          dataPathValidation.errors.forEach(err => {
            errors.push(`⚠️  [${analysis.slug}/${sectionId}] ${err}`)
          })
        }

        const municipalitiesPathValidation = validateEmbedPath(
          municipalitiesPath,
          'municipalitiesPath',
          analysis.slug
        )
        if (!municipalitiesPathValidation.valid) {
          municipalitiesPathValidation.errors.forEach(err => {
            errors.push(`⚠️  [${analysis.slug}/${sectionId}] ${err}`)
          })
        }

        // Validate that data is registered in the data registry
        if (!hasEmbedData(analysis.slug, sectionId)) {
          errors.push(`❌ [${analysis.slug}/${sectionId}] Data not registered in EMBED_DATA_REGISTRY (embed-data-registry.ts)`)
        }
      }
    }
  }

  return { errors, warnings, validatedCount }
}

/**
 * Run validation and exit with appropriate code
 */
export function runValidation() {
  const { errors, warnings, validatedCount } = validateEmbedConfigs()

  // Report results
  console.log(`\n📊 Validation Summary:`)
  console.log(`   Validated: ${validatedCount} file(s)`)
  console.log(`   Warnings: ${warnings.length}`)
  console.log(`   Errors: ${errors.length}`)

  if (warnings.length > 0) {
    console.warn('\n⚠️  Warnings:\n')
    warnings.forEach(warning => console.warn(`   ${warning}`))
  }

  if (errors.length > 0) {
    console.error('\n❌ Validation failed with the following errors:\n')
    errors.forEach(error => console.error(`   ${error}`))
    console.error('\n💡 Fix these issues in:')
    console.error('   - src/lib/embed-config.ts (configuration)')
    console.error('   - src/lib/embed-data-registry.ts (data imports)\n')
    process.exit(1)
  }

  console.log('\n✅ All embed configuration is valid!\n')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation()
}
