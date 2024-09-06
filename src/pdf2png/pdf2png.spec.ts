import { join } from 'path'
import { pdf2png } from './pdf2png'
import { compareImages } from '../compare-images'
import { expect } from 'chai'
import { Dpi } from '../types'

const testDataDir = join(__dirname, '../test-data')
const pdfs = join(testDataDir, 'pdfs')
const singlePage = join(pdfs, 'single-page.pdf')
const twoPage = join(pdfs, 'two-page.pdf')
const cmaps = join(pdfs, 'cmaps.pdf')

const expectedDir = join(testDataDir, 'pdf2png-expected')

describe('pdf2png()', () => {
  it('two-page.pdf png per page with scaling', () => {
    const expectedImage1Path = join(expectedDir, 'two-page_png_per_page_scaled_1.png')
    const expectedImage2Path = join(expectedDir, 'two-page_png_per_page_scaled_2.png')
    return pdf2png(twoPage, { dpi: Dpi.High })
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

  it('two-page.pdf png per page and without scaling', () => {
    const expectedImage1Path = join(expectedDir, 'two-page_png_per_page_1.png')
    const expectedImage2Path = join(expectedDir, 'two-page_png_per_page_2.png')
    return pdf2png(twoPage, { dpi: Dpi.Low })
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

  it('should scale using custom DPI', () => {
    const expectedImagePath = join(expectedDir, 'should_scale_using_custom_DPI.png')
    return pdf2png(singlePage, { dpi: 200 })
      .then((imgs) => compareImages(expectedImagePath, imgs))
      .then((result) => expect(result.equal).to.be.true)
  })

  it('pdf that requires cmaps', () => {
    const expectedImagePath = join(expectedDir, 'cmaps.png')
    return pdf2png(cmaps)
      .then((imgs) => compareImages(expectedImagePath, imgs))
      .then((result) => expect(result.equal).to.be.true)
  })
})
