import { comparePdfToSnapshot, snapshotsDirName } from './compare-pdf-to-snapshot'
import { join } from 'path'
import { expect } from 'chai'
import { existsSync, unlinkSync } from 'fs'

const testDataDir = join(__dirname, './test-data')

const singlePageSmallPdfPath = join(testDataDir, 'single-page-small.pdf')
const singlePagePdfPath = join(testDataDir, 'single-page.pdf')
const twoPagePdfPath = join(testDataDir, 'two-page.pdf')

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
    comparePdfToSnapshot(twoPagePdfPath, __dirname, 'two-page').then((x) => expect(x).to.be.true))

  it('should fail and create diff and new versions of expected image', () =>
    comparePdfToSnapshot(singlePagePdfPath, __dirname, 'two-page').then((x) => {
      expect(x).to.be.false
      const snapshotDiffPath = join(__dirname, snapshotsDirName, 'two-page.diff.png')
      expect(existsSync(snapshotDiffPath)).to.eq(true, 'diff is not created')
      const snapshotNewPath = join(__dirname, snapshotsDirName, 'two-page.new.png')
      expect(existsSync(snapshotNewPath)).to.eq(true, 'new is not created')
    })).timeout(10000)
})
