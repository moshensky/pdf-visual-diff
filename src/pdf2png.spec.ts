import { join } from 'path'
import { pdf2png, Pdf2PngOpts } from './pdf2png'

const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')
const singlePageSmall = join(pdfs, 'single-page-small.pdf')
const singlePage = join(pdfs, 'single-page.pdf')
const tamReview = join(pdfs, 'TAMReview.pdf')
const twoPage = join(pdfs, 'two-page.pdf')

const expectedDir = join(testDataDir, 'pdf2png-expected')

const testPdf2png = (
  pdf: string | Buffer,
  imageName: string,
  opts: Partial<Pdf2PngOpts> = {},
): Promise<void> => {
  const path = join(expectedDir, imageName)
  return pdf2png(pdf, path, opts)
}

describe.only('pdf2png()', () => {
  it('single-page-small.pdf', () => testPdf2png(singlePageSmall, 'single-page-small.png'))
  it('single-page.pdf', () => testPdf2png(singlePage, 'single-page.png'))
  it('TAMReview.pdf', () => testPdf2png(tamReview, 'TAMReview.png')).timeout(40000)
  it('two-page.pdf', () => testPdf2png(twoPage, 'two-page.png'))
  it('two-page.pdf png per page and without scaling', () =>
    testPdf2png(twoPage, 'two-page_png_per_page.png', {
      scaleImage: false,
      combinePages: false,
    })).timeout(40000)
})
