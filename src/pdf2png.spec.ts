import { join, parse } from 'path'
import { pdf2png, Pdf2PngOpts } from './pdf2png'
import { compareImages } from './compare-images'
import { unlinkSync } from 'fs'
import { expect } from 'chai'

const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')
const singlePageSmall = join(pdfs, 'single-page-small.pdf')
const singlePage = join(pdfs, 'single-page.pdf')
const tamReview = join(pdfs, 'TAMReview.pdf')
const twoPage = join(pdfs, 'two-page.pdf')

const expectedDir = join(testDataDir, 'pdf2png-expected')

const rip = (prefix = ''): string => prefix + Math.random().toString(36).substring(7)
const rin = (): string => rip('img_') + '.png'

const testPdf2png = (
  pdf: string | Buffer,
  expectedImageName: string,
  opts: Partial<Pdf2PngOpts> = {},
): Promise<void> => {
  // uncomment ot update expected images
  const expectedImagePath = join(expectedDir, expectedImageName)
  const imagePath = join(__dirname, rin())
  return pdf2png(pdf, imagePath, opts).then(() =>
    compareImages(expectedImagePath, imagePath).then((x) => {
      unlinkSync(imagePath)
      expect(x).to.be.true
    }),
  )
}

describe.only('pdf2png()', () => {
  it('single-page-small.pdf', () => testPdf2png(singlePageSmall, 'single-page-small.png'))
  it('single-page.pdf', () => testPdf2png(singlePage, 'single-page.png'))
  it('TAMReview.pdf', () => testPdf2png(tamReview, 'TAMReview.png')).timeout(40000)
  it('two-page.pdf', () => testPdf2png(twoPage, 'two-page.png'))

  it('two-page.pdf png per page and without scaling', () => {
    const expectedImage1Path = join(expectedDir, 'two-page_png_per_page_1.png')
    const expectedImage2Path = join(expectedDir, 'two-page_png_per_page_2.png')
    const imagesPath = parse(join(__dirname, rin()))
    const image1Path = join(imagesPath.dir, imagesPath.name + '_1' + imagesPath.ext)
    const image2Path = join(imagesPath.dir, imagesPath.name + '_2' + imagesPath.ext)
    return pdf2png(twoPage, join(__dirname, imagesPath.base), {
      scaleImage: false,
      combinePages: false,
    }).then(() =>
      Promise.all([
        compareImages(expectedImage1Path, image1Path).then((x) => {
          unlinkSync(image1Path)
          expect(x).to.be.true
        }),
        compareImages(expectedImage2Path, image2Path).then((x) => {
          unlinkSync(image2Path)
          expect(x).to.be.true
        }),
      ]),
    )
  })
})
