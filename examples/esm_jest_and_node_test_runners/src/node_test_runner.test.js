import test from 'node:test'
import assert from 'node:assert'
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { pathToPdf, pathToChangedPdf, snapshotDir } from './utils.js'

function mkSnapshotName(testContext) {
  console.log(testContext.name.split(' ').join('_'))
  return testContext.name.split(' ').join('_')
}

test('Snapshot should fail', async () => {
  const isMatchingPdf = await comparePdfToSnapshot(
    pathToChangedPdf,
    snapshotDir,
    'PDF_visual_regression',
    {
      pdf2PngOptions: { dpi: 72 },
    },
  )
  assert.strictEqual(isMatchingPdf, false)
})

test('Snapshot should match', async (t) => {
  const isMatchingPdf = await comparePdfToSnapshot(pathToPdf, snapshotDir, mkSnapshotName(t))
  assert.strictEqual(isMatchingPdf, true)
})
