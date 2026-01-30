import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import fs from 'node:fs'
import path from 'node:path'

export const Analysis = defineDocumentType(() => ({
  name: 'Analysis',
  // Only pick the main analysis MDX files; ignore results JSON files
  filePathPattern: `**/content.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    summary: { type: 'string', required: true },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    slug: { type: 'string', required: true },
    sourceProvider: { type: 'string', required: false },
    sourceTitle: { type: 'string', required: false },
    sourceUrl: { type: 'string', required: false },
    sourcePublicationDate: { type: 'date', required: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => `/analyses/${post.slug}`,
    },
  },
}))

function listNonContentDirsToExclude(): string[] {
  const analysesDirAbsolute = path.join(process.cwd(), 'analyses')
  const excludes: string[] = []

  // Exclude non-content helper files that live alongside analyses.
  excludes.push('**/README.md', '**/readme.md', '**/*.yml', '**/*.yaml')

  if (!fs.existsSync(analysesDirAbsolute)) return excludes

  for (const entry of fs.readdirSync(analysesDirAbsolute, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const analysisSlug = entry.name
    for (const dirName of ['results', 'data']) {
      const absolute = path.join(analysesDirAbsolute, analysisSlug, dirName)
      if (fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()) {
        excludes.push(`${analysisSlug}/${dirName}`)
      }
    }
  }

  return excludes
}

export default makeSource({
  contentDirPath: 'analyses',
  contentDirExclude: listNonContentDirsToExclude(),
  documentTypes: [Analysis],
  disableImportAliasWarning: true,
})
