import { join } from 'path'
import { pdf2png } from './pdf2png'
import { compareImages } from './compare-images'
import { expect } from 'chai'

const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')
const twoPage = join(pdfs, 'two-page.pdf')

const expectedDir = join(testDataDir, 'pdf2png-expected')

describe('pdf2png()', () => {
  it('two-page.pdf png per page and without scaling', () => {
    const expectedImage1Path = join(expectedDir, 'two-page_png_per_page_1.png')
    const expectedImage2Path = join(expectedDir, 'two-page_png_per_page_2.png')
    return pdf2png(twoPage, { scaleImage: false })
      .then((imgs) =>
        Promise.all([
          compareImages(expectedImage1Path, [imgs[0]]),
          compareImages(expectedImage2Path, [imgs[1]]),
        ]),
      )
      .then((results) => {
        results.forEach((x) => expect(x.equal).to.be.true)
      })
  })
})
