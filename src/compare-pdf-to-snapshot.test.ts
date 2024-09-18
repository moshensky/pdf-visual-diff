import { describe, it } from 'node:test'
import * as assert from 'node:assert/strict'
import { Jimp, JimpInstance } from 'jimp'
import {
  comparePdfToSnapshot,
  snapshotsDirName,
  CompareOptions,
  RegionMask,
} from './compare-pdf-to-snapshot'
import { join } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { compareImages } from './compare-images'
import * as fs from 'fs/promises'
import { Dpi } from './types'

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
      assert.strictEqual(x, true)
      assert.strictEqual(existsSync(snapshotPath), true)
      unlinkSync(snapshotPath)
    })
  })

  it('should fail and create diff with new version', () =>
    comparePdfToSnapshot(singlePagePdfPath, __dirname, 'two-page').then((x) => {
      assert.strictEqual(x, false)
      const snapshotDiffPath = join(__dirname, snapshotsDirName, 'two-page.diff.png')
      assert.strictEqual(existsSync(snapshotDiffPath), true, 'diff is not created')
      const snapshotNewPath = join(__dirname, snapshotsDirName, 'two-page.new.png')
      assert.strictEqual(existsSync(snapshotNewPath), true, 'new is not created')
    }))

  describe('should pass', () => {
    it('should pass', () =>
      comparePdfToSnapshot(twoPagePdfPath, __dirname, 'two-page-success').then((x) =>
        assert.strictEqual(x, true),
      ))

    const testDataDir = join(__dirname, './test-data')
    const pdfs = join(testDataDir, 'pdfs')
    const singlePageSmall = join(pdfs, 'single-page-small.pdf')
    const singlePage = join(pdfs, 'single-page.pdf')
    const tamReview = join(pdfs, 'TAMReview.pdf')
    const twoPage = join(pdfs, 'two-page.pdf')
    const expectedDir = join(testDataDir, 'pdf2png-expected')

    const testPdf2png = (
      pdf: string | Buffer,
      expectedImageName: string,
      options?: CompareOptions,
    ): Promise<void> => {
      return comparePdfToSnapshot(pdf, expectedDir, expectedImageName, options).then((x) => {
        assert.strictEqual(x, true)
      })
    }

    it('single-page-small.pdf', () => testPdf2png(singlePageSmall, 'single-page-small'))
    it('single-page.pdf', () => testPdf2png(singlePage, 'single-page'))
    it('TAMReview.pdf', () => testPdf2png(tamReview, 'TAMReview'))
    it('TAMReview.pdf without scaling', () =>
      testPdf2png(tamReview, 'TAMReview_without_scaling', {
        pdf2PngOptions: { dpi: Dpi.Low },
      }))
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
    const opts: CompareOptions = {
      maskRegions: () => [blueMask, greenMask],
    }

    it('should succeed comparing masked pdf', () =>
      comparePdfToSnapshot(singlePagePdfPath, __dirname, 'mask-rectangle-masks', opts).then((x) =>
        assert.strictEqual(x, true),
      ))

    it('should succeed comparing masked pdf without scaling', () => {
      const blueMaskSmall: RegionMask = {
        type: 'rectangle-mask',
        x: 25,
        y: 37,
        width: 70,
        height: 50,
        color: 'Blue',
      }
      const greenMaskSmall: RegionMask = {
        type: 'rectangle-mask',
        x: 55,
        y: 100,
        width: 45,
        height: 25,
        color: 'Green',
      }
      return comparePdfToSnapshot(
        singlePagePdfPath,
        __dirname,
        'mask-rectangle-masks_without_scaling',
        {
          pdf2PngOptions: { dpi: 72 },
          maskRegions: () => [blueMaskSmall, greenMaskSmall],
        },
      ).then((x) => assert.strictEqual(x, true))
    })

    it('should mask multi page pdf', () =>
      comparePdfToSnapshot(twoPagePdfPath, __dirname, 'mask-multi-page-pdf', opts).then((x) =>
        assert.strictEqual(x, true),
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
      }).then((x) => assert.strictEqual(x, true)))

    it('should mask only second page of the pdf', () =>
      comparePdfToSnapshot(twoPagePdfPath, __dirname, 'mask-only-second-page-of-the-pdf', {
        maskRegions: (page) => (page === 2 ? [blueMask, greenMask] : []),
      }).then((x) => assert.strictEqual(x, true)))

    it('should mask only second page of the pdf and handle undefined masks', () =>
      comparePdfToSnapshot(
        twoPagePdfPath,
        __dirname,
        'mask-only-second-page-of-the-pdf-with-undefined',
        {
          maskRegions: (page) => (page === 2 ? [blueMask, greenMask] : undefined),
        },
      ).then((x) => assert.strictEqual(x, true)))

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
        .then((x) => assert.strictEqual(x, true))
        .then(() => Jimp.read(snapshotPath))
        .then((x) => x as JimpInstance)
        .then((img) =>
          compareImages(expectedImagePath, [img], { tolerance: 0 }).then((x) =>
            assert.strictEqual(
              x.equal,
              true,
              'generated initial rectangle masks does not match expected one',
            ),
          ),
        )
        .then(() => unlinkSync(snapshotPath))
    })
  })

  describe('when previous snapshot file does not exist', () => {
    describe('allowSnapshotCreation is true (default)', () => {
      it('should create new snapshot if missing and failOnMissingSnapshot is false (default)', () => {
        const snapshotName = 'allow-create-snapshot'
        const snapshotPath = join(__dirname, snapshotsDirName, snapshotName + '.png')
        if (existsSync(snapshotPath)) {
          unlinkSync(snapshotPath)
        }
        return comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName).then((x) => {
          assert.strictEqual(x, true)
          assert.strictEqual(existsSync(snapshotPath), true, 'Snapshot should be created')
          unlinkSync(snapshotPath)
        })
      })

      it('should create new snapshot if missing and failOnMissingSnapshot is true', () => {
        const snapshotName = 'allow-create-snapshot'
        const snapshotPath = join(__dirname, snapshotsDirName, snapshotName + '.png')
        if (existsSync(snapshotPath)) {
          unlinkSync(snapshotPath)
        }
        return comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName, {
          failOnMissingSnapshot: true,
        }).then((x) => {
          assert.strictEqual(x, true)
          assert.strictEqual(existsSync(snapshotPath), true, 'Snapshot should be created')
          unlinkSync(snapshotPath)
        })
      })
    })

    describe('allowSnapshotCreation is false', () => {
      it('should fail if snapshot is missing and failOnMissingSnapshot is true', () => {
        const snapshotName = 'fail-on-missing-snapshot'
        const snapshotPath = join(__dirname, snapshotsDirName, snapshotName + '.png')
        if (existsSync(snapshotPath)) {
          unlinkSync(snapshotPath)
        }
        return comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName, {
          allowSnapshotCreation: false,
          failOnMissingSnapshot: true,
        }).then((x) => {
          assert.strictEqual(x, false)
          assert.strictEqual(existsSync(snapshotPath), false, 'Snapshot should not be created')
        })
      })

      it('should pass if snapshot is missing and failOnMissingSnapshot is false (default)', () => {
        const snapshotName = 'pass-no-create-no-fail'
        const snapshotPath = join(__dirname, snapshotsDirName, snapshotName + '.png')
        if (existsSync(snapshotPath)) {
          unlinkSync(snapshotPath)
        }
        return comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName, {
          allowSnapshotCreation: false,
          failOnMissingSnapshot: false,
        }).then((x) => {
          assert.strictEqual(x, true)
          assert.strictEqual(existsSync(snapshotPath), false, 'Snapshot should not be created')
        })
      })
    })
  })
})
