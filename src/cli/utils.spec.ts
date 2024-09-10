import * as assert from 'node:assert/strict'
import { mkCurrentSnapshotPath, mkDiffSnapshotPath } from './utils'

const filePath = '/pdf-visual-diff/src/__snapshots__/two-page.new.png'

describe('cli utils', () => {
  it('mkCurrentSnapshotPath()', async () =>
    assert.strictEqual(
      mkCurrentSnapshotPath(filePath),
      '/pdf-visual-diff/src/__snapshots__/two-page.png',
    ))

  it('mkDiffSnapshotPath()', async () =>
    assert.strictEqual(
      mkDiffSnapshotPath(filePath),
      '/pdf-visual-diff/src/__snapshots__/two-page.diff.png',
    ))
})
