/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['pdf-visual-diff/lib/toMatchPdfSnapshot'],
}

export default config
