import { dirname, join } from 'path'
import { pdf2png } from './pdf2png'
import { compareImages } from './compare-images'
import { expect } from 'chai'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')
const twoPage = join(pdfs, 'two-page.pdf')
const cmaps = join(pdfs, 'cmaps.pdf')

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

  it('pdf that requires cmaps', () => {
    const expectedImagePath = join(expectedDir, 'cmaps.png')
    return pdf2png(cmaps)
      .then((imgs) => compareImages(expectedImagePath, imgs))
      .then((result) => expect(result.equal).to.be.true)
  })
})
