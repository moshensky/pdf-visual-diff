import { describe, it } from 'node:test'
import * as assert from 'node:assert/strict'
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { mkSamplePdf } from './index'

describe('mkSamplePdf()', () => {
  it('should pass', async () => {
    const pdf = await mkSamplePdf()
    await comparePdfToSnapshot(pdf, __dirname, 'dynamically-generated-pdf').then((x) =>
      assert.strictEqual(x, true),
    )
  })

  it('should fail, because generated pdf is different from the snapshot', async () => {
    const pdf = await mkSamplePdf('this string does not exist in the snapshot')
    await comparePdfToSnapshot(pdf, __dirname, 'dynamically-generated-pdf-with-text').then((x) =>
      assert.strictEqual(x, false),
    )
  })
})
