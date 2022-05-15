import { join } from 'path'
import { pdf2png } from './pdf2png'
import { compareImages } from './compare-images'
import fs0 from 'fs'
import { expect } from 'chai'

const fs = fs0.promises

const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')
const singlePageSmall = join(pdfs, 'single-page-small.pdf')
const singlePage = join(pdfs, 'single-page.pdf')
const tamReview = join(pdfs, 'TAMReview.pdf')
const twoPage = join(pdfs, 'two-page.pdf')

const expectedDir = join(testDataDir, 'pdf2png-expected')

const testPdf2png = (pdf: string | Buffer, expectedImageName: string): Promise<void> => {
  const expectedImagePath = join(expectedDir, expectedImageName)
  return pdf2png(pdf).then((imgs) =>
    compareImages(expectedImagePath, imgs).then((x) => {
      expect(x.equal).to.be.true
    }),
  )
}

describe('pdf2png()', () => {
  it('single-page-small.pdf', () => testPdf2png(singlePageSmall, 'single-page-small.png'))
  it('single-page.pdf', () => testPdf2png(singlePage, 'single-page.png'))
  it('TAMReview.pdf', () => testPdf2png(tamReview, 'TAMReview.png')).timeout(40000)
  it('two-page.pdf', () => testPdf2png(twoPage, 'two-page.png'))
  it('two-page.pdf buffer', () => fs.readFile(twoPage).then((x) => testPdf2png(x, 'two-page.png')))

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
