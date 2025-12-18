import { describe, it } from 'node:test'
import * as assert from 'node:assert/strict'
import * as path from 'node:path'
import { mkCurrentSnapshotPath, mkDiffSnapshotPath } from './utils'

// Use path.join to create OS-appropriate paths for testing
const filePath = path.join('pdf-visual-diff', 'src', '__snapshots__', 'two-page.new.png')
const expectedCurrentPath = path.join('pdf-visual-diff', 'src', '__snapshots__', 'two-page.png')
const expectedDiffPath = path.join('pdf-visual-diff', 'src', '__snapshots__', 'two-page.diff.png')

describe('cli utils', () => {
  it('mkCurrentSnapshotPath()', async () =>
    assert.strictEqual(mkCurrentSnapshotPath(filePath), expectedCurrentPath))

  it('mkDiffSnapshotPath()', async () =>
    assert.strictEqual(mkDiffSnapshotPath(filePath), expectedDiffPath))
})
