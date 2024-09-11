const { join } = require('node:path')
const { comparePdfToSnapshot } = require('../lib')

const twoPagePdfPath = join(__dirname, '../src/test-data/pdfs/', 'two-page.pdf')
const snapshotDir = join(__dirname)

/** @type {import('../lib').CompareOptions} */
const opts = {
  pdf2PngOptions: { dpi: 72 },
}

describe('jest smoke tests', () => {
  test(
    'plain fn',
    () =>
      comparePdfToSnapshot(twoPagePdfPath, snapshotDir, 'jest_smoke_tests_plain_fn', opts).then(
        (isEqual) => {
          expect(isEqual).toEqual(true)
        },
      ),
    10_000,
  )

  test('custom matcher', () => expect(twoPagePdfPath).toMatchPdfSnapshot(opts), 10_000)
})
