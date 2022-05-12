import { join } from 'path'
import { pdf2png } from './pdf2png'

const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')
const singlePageSmall = join(pdfs, 'single-page-small.pdf')
const singlePage = join(pdfs, 'single-page.pdf')
const tamReview = join(pdfs, 'TAMReview.pdf')
const twoPage = join(pdfs, 'two-page.pdf')

describe.only('pdf2png()', () => {
  it('single-page-small.pdf', () => pdf2png(singlePageSmall, 'single-page-small.png'))
  it('single-page.pdf', () => pdf2png(singlePage, 'single-page.png'))
  it('TAMReview.pdf', () => pdf2png(tamReview, 'TAMReview.png')).timeout(40000)
  it('two-page.pdf', () => pdf2png(twoPage, 'two-page.png'))
  it('two-page.pdf png per page and without scaling', () =>
    pdf2png(twoPage, 'two-page_png_per_page.png', {
      scaleImage: false,
      combinePages: false,
    })).timeout(40000)
})
