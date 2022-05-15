import { expect } from 'chai'
import { mkCurrentSnapshotPath, mkDiffSnapshotPath } from './utils'

const filePath = '/pdf-visual-diff/src/__snapshots__/two-page.new.png'

describe('cli utils', () => {
  it('mkCurrentSnapshotPath()', async () =>
    expect(mkCurrentSnapshotPath(filePath)).to.equal(
      '/pdf-visual-diff/src/__snapshots__/two-page.png',
    ))

  it('mkDiffSnapshotPath()', async () =>
    expect(mkDiffSnapshotPath(filePath)).to.equal(
      '/pdf-visual-diff/src/__snapshots__/two-page.diff.png',
    ))
})
