import test from 'node:test'
import assert from 'node:assert'
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { pathToPdf, pathToChangedPdf } from './utils.js'

test('Snapshot should fail', async () => {
  const isMatchingPdf = await comparePdfToSnapshot(pathToChangedPdf, 'PDF_visual_regression', {
    pdf2PngOptions: { dpi: 72 },
  })
  assert.strictEqual(isMatchingPdf, false)
})

test('Snapshot should match', async () => {
  const isMatchingPdf = await comparePdfToSnapshot(pathToPdf, 'PDF_visual_regression', {
    pdf2PngOptions: { dpi: 72 },
  })
  assert.strictEqual(isMatchingPdf, true)
})
