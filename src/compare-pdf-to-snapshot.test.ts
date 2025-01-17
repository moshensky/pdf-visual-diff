import { describe, it } from 'node:test'
import * as assert from 'node:assert/strict'
import { join } from 'node:path'
import { access, unlink, readFile } from 'node:fs/promises'
import { Jimp, JimpInstance } from 'jimp'
import {
  comparePdfToSnapshot,
  SNAPSHOTS_DIR_NAME,
  CompareOptions,
  RegionMask,
} from './compare-pdf-to-snapshot'
import { compareImages } from './compare-images'
import { Dpi } from './types'

const testDataDir = join(__dirname, './test-data')
const pdfs = join(testDataDir, 'pdfs')

const singlePageSmallPdfPath = join(pdfs, 'single-page-small.pdf')
const singlePagePdfPath = join(pdfs, 'single-page.pdf')
const barcodes1PdfPath = join(pdfs, 'barcodes-1.pdf')
const twoPagePdfPath = join(pdfs, 'two-page.pdf')

async function removeIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch {
    // File doesn't exist, no need to remove
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

describe('comparePdfToSnapshot()', () => {
  it('should create new snapshot, when one does not exists', async () => {
    const snapshotName = 'single-page-small'
    const snapshotPath = join(__dirname, SNAPSHOTS_DIR_NAME, `${snapshotName}.png`)

    await removeIfExists(snapshotPath)

    const isEqual = await comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName)
    assert.strictEqual(isEqual, true)
    assert.strictEqual(await fileExists(snapshotPath), true)
    await removeIfExists(snapshotPath)
  })

  it('should fail and create diff with new version', async () => {
    const isEqual = await comparePdfToSnapshot(singlePagePdfPath, __dirname, 'two-page')
    // Should not match
    assert.strictEqual(isEqual, false)

    const snapshotDiffPath = join(__dirname, SNAPSHOTS_DIR_NAME, 'two-page.diff.png')
    assert.strictEqual(await fileExists(snapshotDiffPath), true, 'diff is not created')
    const snapshotNewPath = join(__dirname, SNAPSHOTS_DIR_NAME, 'two-page.new.png')
    assert.strictEqual(await fileExists(snapshotNewPath), true, 'new is not created')
  })

  it('should remove diff and new snapshots when matches with reference snapshot', async () => {
    const snapshotName = 'should-remove-diff-and-new'
    const snapshotBase = join(__dirname, SNAPSHOTS_DIR_NAME, snapshotName)
    const snapshotPathDiff: `${string}.${string}` = `${snapshotBase}.diff.png`
    const snapshotPathNew: `${string}.${string}` = `${snapshotBase}.new.png`

    await removeIfExists(snapshotPathDiff)
    await removeIfExists(snapshotPathNew)
    await new Jimp({ width: 100, height: 100 }).write(snapshotPathDiff)
    await new Jimp({ width: 100, height: 100 }).write(snapshotPathNew)

    const isEqual = await comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName)
    assert.strictEqual(isEqual, true)
    assert.strictEqual(
      await fileExists(snapshotPathDiff),
      false,
      'Snapshot diff should not exists.',
    )
    assert.strictEqual(await fileExists(snapshotPathNew), false, 'Snapshot new should not exists.')
  })

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
    it('two-page.pdf buffer', () => readFile(twoPage).then((x) => testPdf2png(x, 'two-page')))
  })

  describe('mask regions', () => {
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

    it('should create initial masked image', async () => {
      const snapshotName = 'initial-rectangle-masks'
      const snapshotPath = join(__dirname, SNAPSHOTS_DIR_NAME, snapshotName + '.png')
      const expectedImagePath = join(
        __dirname,
        './test-data',
        'expected-initial-rectangle-masks.png',
      )
      await removeIfExists(snapshotPath)

      const isEqual = await comparePdfToSnapshot(singlePagePdfPath, __dirname, snapshotName, opts)
      assert.strictEqual(isEqual, true)

      const img = (await Jimp.read(snapshotPath)) as JimpInstance
      const { equal } = await compareImages(expectedImagePath, [img], { tolerance: 0 })
      assert.strictEqual(equal, true, 'Rectangle masks does not match expected one')

      await removeIfExists(snapshotPath)
    })
  })

  describe('when reference snapshot does not exist', () => {
    it('should be created when `failOnMissingSnapshot` is not set', async () => {
      const snapshotName = 'allow-create-snapshot-when-failOnMissingSnapshot-is-not-set'
      const snapshotPath = join(__dirname, SNAPSHOTS_DIR_NAME, snapshotName + '.png')
      await removeIfExists(snapshotPath)

      const isEqual = await comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName)
      assert.strictEqual(isEqual, true)
      assert.strictEqual(await fileExists(snapshotPath), true, 'Snapshot should be created')
      removeIfExists(snapshotPath)
    })

    it('should be created when `failOnMissingSnapshot` is set to `false`', async () => {
      const snapshotName = 'allow-create-snapshot-when-failOnMissingSnapshot-is-set-to-false'
      const snapshotPath = join(__dirname, SNAPSHOTS_DIR_NAME, snapshotName + '.png')
      await removeIfExists(snapshotPath)

      const isEqual = await comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName, {
        failOnMissingSnapshot: false,
      })
      assert.strictEqual(isEqual, true)
      assert.strictEqual(await fileExists(snapshotPath), true, 'Snapshot should be created')
      await removeIfExists(snapshotPath)
    })

    it('should not be created and return `false` when `failOnMissingSnapshot` is set to `true`', async () => {
      const snapshotName = 'fail-on-missing-snapshot-when-failOnMissingSnapshot-is-set-to-true'
      const snapshotPath = join(__dirname, SNAPSHOTS_DIR_NAME, snapshotName + '.png')
      await removeIfExists(snapshotPath)

      const isEqual = await comparePdfToSnapshot(singlePageSmallPdfPath, __dirname, snapshotName, {
        failOnMissingSnapshot: true,
      })
      assert.strictEqual(isEqual, false)
      assert.strictEqual(await fileExists(snapshotPath), false, 'Snapshot should not be created')
    })
  })

  describe('github issue', () => {
    it('#89 discrepancy between windows and linux/mac using v0.14.0', async () => {
      await comparePdfToSnapshot(barcodes1PdfPath, __dirname, 'barcodes-1-default-opts').then((x) =>
        assert.strictEqual(x, true),
      )

      await comparePdfToSnapshot(barcodes1PdfPath, __dirname, 'barcodes-1-dpi-low', {
        pdf2PngOptions: { dpi: Dpi.Low },
      }).then((x) => assert.strictEqual(x, true))

      await comparePdfToSnapshot(barcodes1PdfPath, __dirname, 'barcodes-1-default-low-x-4', {
        pdf2PngOptions: { dpi: Dpi.Low * 4 },
      }).then((x) => assert.strictEqual(x, true))
    })
  })
})
