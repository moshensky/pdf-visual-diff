import { mkSamplePdf } from './index'
import { expect } from 'chai'
import { comparePdfToSnapshot } from 'pdf-visual-diff'

describe('mkSamplePdf()', () => {
  it('should pass', async () => {
    const pdf = await mkSamplePdf()
    await comparePdfToSnapshot(pdf, __dirname, 'dynamically-generated-pdf').then(
      (x) => expect(x).to.be.true,
    )
  })

  it('should fail, because generated pdf is different from the snapshot', async () => {
    const pdf = await mkSamplePdf('this string does not exist in the snapshot')
    await comparePdfToSnapshot(pdf, __dirname, 'dynamically-generated-pdf-with-text').then(
      (x) => expect(x).to.be.true,
    )
  })
})
