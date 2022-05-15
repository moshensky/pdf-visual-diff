import { read } from 'jimp'
import { comparePdfToSnapshot, snapshotsDirName, CompareOptions } from './compare-pdf-to-snapshot'
import { join } from 'path'
import { expect } from 'chai'
import { existsSync, unlinkSync } from 'fs'
import { compareImages } from './compare-images'

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

  it('should pass', () =>
    comparePdfToSnapshot(twoPagePdfPath, __dirname, 'two-page-success').then(
      (x) => expect(x).to.be.true,
    ))

  it('should fail and create diff with new version', () =>
    comparePdfToSnapshot(singlePagePdfPath, __dirname, 'two-page').then((x) => {
      expect(x).to.be.false
      const snapshotDiffPath = join(__dirname, snapshotsDirName, 'two-page.diff.png')
      expect(existsSync(snapshotDiffPath)).to.eq(true, 'diff is not created')
      const snapshotNewPath = join(__dirname, snapshotsDirName, 'two-page.new.png')
      expect(existsSync(snapshotNewPath)).to.eq(true, 'new is not created')
    }))

  describe('maskRegions', () => {
    const opts: Partial<CompareOptions> = {
      maskRegions: [
        {
          type: 'rectangle-mask',
          x: 50,
          y: 75,
          width: 140,
          height: 100,
          color: 'Blue',
        },
        {
          type: 'rectangle-mask',
          x: 110,
          y: 200,
          width: 90,
          height: 50,
          color: 'Green',
        },
      ],
    }

    it('should succeed comparing masked image', () =>
      comparePdfToSnapshot(singlePagePdfPath, __dirname, 'rectangle-masks', opts).then(
        (x) => expect(x).to.be.true,
      ))

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
