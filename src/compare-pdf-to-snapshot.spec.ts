import { read } from 'jimp'
import {
  comparePdfToSnapshot,
  snapshotsDirName,
  CompareOptions,
  RegionMask,
} from './compare-pdf-to-snapshot'
import { join } from 'path'
import { expect } from 'chai'
import { existsSync, unlinkSync } from 'fs'
import { compareImages } from './compare-images'
import fs0 from 'fs'
const fs = fs0.promises

const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')

const singlePageSmallPdfPath = join(pdfs, 'single-page-small.pdf')
const singlePagePdfPath = join(pdfs, 'single-page.pdf')
const twoPagePdfPath = join(pdfs, 'two-page.pdf')

describe('comparePdfToSnapshot()', () => {
  it('should create new snapshot, when one does not exists', () => {
    const snapshotName = 'single-page-small'
    const snapshotPath = join(__dirname, snapshotsDirName, snapshotName + '.png')
    if (existsSync(snapshotPath)) {
      unlinkSync(snapshotPath)
    }
    return comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName).then((x) => {
      expect(x).to.be.true
      expect(existsSync(snapshotPath)).to.be.true
      unlinkSync(snapshotPath)
    })
  })

  it('should fail and create diff with new version', () =>
    comparePdfToSnapshot(singlePagePdfPath, __dirname, 'two-page').then((x) => {
      expect(x).to.be.false
      const snapshotDiffPath = join(__dirname, snapshotsDirName, 'two-page.diff.png')
      expect(existsSync(snapshotDiffPath)).to.eq(true, 'diff is not created')
      const snapshotNewPath = join(__dirname, snapshotsDirName, 'two-page.new.png')
      expect(existsSync(snapshotNewPath)).to.eq(true, 'new is not created')
    }))

  describe('should pass', () => {
    it('should pass', () =>
      comparePdfToSnapshot(twoPagePdfPath, __dirname, 'two-page-success').then(
        (x) => expect(x).to.be.true,
      ))

    const testDataDir = join(__dirname, './test-data')
    const pdfs = join(testDataDir, 'pdfs')
    const singlePageSmall = join(pdfs, 'single-page-small.pdf')
    const singlePage = join(pdfs, 'single-page.pdf')
    const tamReview = join(pdfs, 'TAMReview.pdf')
    const twoPage = join(pdfs, 'two-page.pdf')
    const expectedDir = join(testDataDir, 'pdf2png-expected')

    const testPdf2png = (pdf: string | Buffer, expectedImageName: string): Promise<void> => {
      return comparePdfToSnapshot(pdf, expectedDir, expectedImageName).then((x) => {
        expect(x).to.be.true
      })
    }

    it('single-page-small.pdf', () => testPdf2png(singlePageSmall, 'single-page-small'))
    it('single-page.pdf', () => testPdf2png(singlePage, 'single-page'))
    it('TAMReview.pdf', () => testPdf2png(tamReview, 'TAMReview')).timeout(40000)
    it('two-page.pdf', () => testPdf2png(twoPage, 'two-page'))
    it('two-page.pdf buffer', () => fs.readFile(twoPage).then((x) => testPdf2png(x, 'two-page')))
  })

  describe('maskRegions', () => {
    const blueMask: RegionMask = {
      type: 'rectangle-mask',
      x: 50,
      y: 75,
      width: 140,
      height: 100,
      color: 'Blue',
    }
    const greenMask: RegionMask = {
      type: 'rectangle-mask',
      x: 110,
      y: 200,
      width: 90,
      height: 50,
      color: 'Green',
    }
    const opts: Partial<CompareOptions> = {
      maskRegions: () => [blueMask, greenMask],
    }

    it('should succeed comparing masked pdf', () =>
      comparePdfToSnapshot(singlePagePdfPath, __dirname, 'mask-rectangle-masks', opts).then(
        (x) => expect(x).to.be.true,
      ))

    it('should mask multi page pdf', () =>
      comparePdfToSnapshot(twoPagePdfPath, __dirname, 'mask-multi-page-pdf', opts).then(
        (x) => expect(x).to.be.true,
      ))

    it('should have different mask per page', () =>
      comparePdfToSnapshot(twoPagePdfPath, __dirname, 'mask-different-mask-per-page', {
        maskRegions: (page) => {
          switch (page) {
            case 1:
              return [blueMask]
            case 2:
              return [greenMask]
            default:
              return []
          }
        },
      }).then((x) => expect(x).to.be.true))

    it('should mask only second page of the pdf', () =>
      comparePdfToSnapshot(twoPagePdfPath, __dirname, 'mask-only-second-page-of-the-pdf', {
        maskRegions: (page) => (page === 2 ? [blueMask, greenMask] : []),
      }).then((x) => expect(x).to.be.true))

    it('should mask only second page of the pdf and handle undefined masks', () =>
      comparePdfToSnapshot(
        twoPagePdfPath,
        __dirname,
        'mask-only-second-page-of-the-pdf-with-undefined',
        {
          maskRegions: (page) => (page === 2 ? [blueMask, greenMask] : undefined),
        },
      ).then((x) => expect(x).to.be.true))

    it('should create initial masked image', () => {
      const snapshotName = 'initial-rectangle-masks'
      const snapshotPath = join(__dirname, snapshotsDirName, snapshotName + '.png')
      const expectedImagePath = join(
        __dirname,
        './test-data',
        'expected-initial-rectangle-masks.png',
      )
      if (existsSync(snapshotPath)) {
        unlinkSync(snapshotPath)
      }
      return comparePdfToSnapshot(singlePagePdfPath, __dirname, snapshotName, opts)
        .then((x) => expect(x).to.be.true)
        .then(() => read(snapshotPath))
        .then((img) =>
          compareImages(expectedImagePath, [img], { tolerance: 0 }).then((x) =>
            expect(x.equal).to.eq(
              true,
              'generated initial rectangle masks does not match expected one',
            ),
          ),
        )
        .then(() => unlinkSync(snapshotPath))
    })
  })
})
