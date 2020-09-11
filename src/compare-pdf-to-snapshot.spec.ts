import { comparePdfToSnapshot, snapshotsDirName } from './compare-pdf-to-snapshot'
import { join } from 'path'
import { expect } from 'chai'
import { existsSync, unlinkSync } from 'fs'
import { compare } from './compare'

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
    }))

  it('custom options', () =>
    comparePdfToSnapshot(singlePagePdfPath, __dirname, 'two-page-overwrite-opts', {
      highlightColor: 'Red',
      highlightStyle: 'XOR',
    }).then((x) => {
      expect(x).to.be.false
      const snapshotDiffPath = join(__dirname, snapshotsDirName, 'two-page-overwrite-opts.diff.png')
      expect(existsSync(snapshotDiffPath)).to.eq(true, 'diff is not created')
      const snapshotNewPath = join(__dirname, snapshotsDirName, 'two-page-overwrite-opts.new.png')
      expect(existsSync(snapshotNewPath)).to.eq(true, 'new is not created')

      const expectedImagePath = join(
        __dirname,
        './test-data',
        'expected-two-page-overwrite-opts.diff.png',
      )
      compare(expectedImagePath, snapshotDiffPath, { tolerance: 0 }).then((x) =>
        expect(x).to.eq(true, 'generated diff image does not match expected one'),
      )
    }))
})
