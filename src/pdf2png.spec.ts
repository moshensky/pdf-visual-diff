import { join } from 'path'
import { pdf2png } from './pdf2png'

const testDataDir = join(__dirname, './test-data')
const monkeyPdfPath = join(testDataDir, 'compressed.tracemonkey-pldi-09.pdf')
const singlePageSmallPdfPath = join(testDataDir, 'single-page-small.pdf')
const twoPagePdfPath = join(testDataDir, 'two-page.pdf')

describe.only('pdf2png()', () => {
  it('should convert', () => pdf2png(singlePageSmallPdfPath, 'output3.png'))
  it('should convert two pages', () => pdf2png(twoPagePdfPath, 'two_page.png'))
  it('should convert long pdf (scaled)', () =>
    pdf2png(monkeyPdfPath, 'monkey.png', { scaleImage: false, combinePages: false })).timeout(20000)
  it('should convert long pdf (scaled)', () => pdf2png(monkeyPdfPath, 'monkey1.png')).timeout(40000)
})
