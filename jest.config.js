/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['./lib/toMatchPdfSnapshot'],
}

module.exports = config
