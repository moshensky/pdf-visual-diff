import { compareImages } from './compare-images'
import { pdfToImage, pdfToImages } from './convert-pdf'
import { expect } from 'chai'
import { join } from 'path'
import { unlinkSync, readFileSync, rmdirSync } from 'fs'

const testDataDir = join(__dirname, './test-data')

const singlePageSmallPdfPath = join(testDataDir, 'single-page-small.pdf')
const singlePageSmallExpectedImagePath = join(testDataDir, 'single-page-small-expected.png')

const singlePagePdfPath = join(testDataDir, 'single-page.pdf')
const singlePageExpectedImagePath = join(testDataDir, 'single-page-expected.png')

const twoPagePdfPath = join(testDataDir, 'two-page.pdf')
const twoPageExpectedImagePath = join(testDataDir, 'two-page-expected.png')

const expectedTwoPageFirstPageImage = join(testDataDir, 'two-page-expected', 'first.png')
const expectedTwoPageSecondPageImage = join(testDataDir, 'two-page-expected', 'second.png')

const rip = (): string => Math.random().toString(36).substring(7)
const rin = (): string => rip() + '.png'

const mkTest = (t: (x: string) => string | Buffer) => (
  pdfPath: string,
  expectedImagePath: string,
): Promise<void> => {
  const imagePath = join(__dirname, rin())
  return pdfToImage(t(pdfPath), imagePath).then(() =>
    compareImages(expectedImagePath, imagePath).then((x) => {
      unlinkSync(imagePath)
      expect(x).to.be.true
    }),
  )
}

describe('pdfToImage() Buffer', () => {
  const test = mkTest((x) => readFileSync(x))

  it('should convert single page small pdf to one image', () =>
    test(singlePageSmallPdfPath, singlePageSmallExpectedImagePath))

  it('should convert single page pdf to one image', () =>
    test(singlePagePdfPath, singlePageExpectedImagePath))

  it('should convert two page pdf to one image', () =>
    test(twoPagePdfPath, twoPageExpectedImagePath))
})

describe('pdfToImage() path to pdf', () => {
  const test = mkTest((x) => x)

  it('should convert single page small pdf to one image', () =>
    test(singlePageSmallPdfPath, singlePageSmallExpectedImagePath))

  it('should convert single page pdf to one image', () =>
    test(singlePagePdfPath, singlePageExpectedImagePath))

  it('should convert two page pdf to one image', () =>
    test(twoPagePdfPath, twoPageExpectedImagePath))
})

describe('pdfToImages()', () => {
  it('should convert two page pdf to two images', () => {
    const imagesDir = join(__dirname, rip())
    const imageName = rip()
    return pdfToImages(twoPagePdfPath, imagesDir, imageName).then(() =>
      Promise.all([
        compareImages(expectedTwoPageFirstPageImage, join(imagesDir, imageName + '000.png')).then(
          (x) => {
            expect(x).to.be.true
          },
        ),
        compareImages(expectedTwoPageSecondPageImage, join(imagesDir, imageName + '001.png')).then(
          (x) => {
            expect(x).to.be.true
          },
        ),
      ]).then(() => {
        rmdirSync(imagesDir, { recursive: true })
      }),
    )
  })
})
