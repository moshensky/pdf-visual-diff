import { describe, it } from 'node:test'
import * as assert from 'node:assert/strict'
import { compareImages, mkDiffPath } from './compare-images'
import { join } from 'path'
import { existsSync } from 'fs'
import { Jimp, JimpInstance } from 'jimp'

describe('mkDiffPath()', () => {
  it('should mk path with extension', () =>
    assert.strictEqual(mkDiffPath('some-path.ext'), 'some-path.diff.ext'))

  it('should mk path with extension when starts with .', () =>
    assert.strictEqual(mkDiffPath('./some-path.ext'), './some-path.diff.ext'))

  it('should handle empty', () => assert.strictEqual(mkDiffPath(''), '.diff'))

  it('should mk path without extension', () =>
    assert.strictEqual(mkDiffPath('some-path'), 'some-path.diff'))
})

const expectedImageName = 'sample-image-expected.png'
const sampleImage = 'sample-image.png'
const sampleImage2 = 'sample-image-2.png'
const testDataDir = join(__dirname, './test-data')
const expectedImagePath = join(testDataDir, expectedImageName)
const imagePath = join(testDataDir, sampleImage)
const image2Path = join(testDataDir, sampleImage2)

describe('compareImages()', () => {
  it('should succeed comparing', () =>
    Jimp.read(imagePath)
      .then((x) => x as JimpInstance)
      .then((img) => compareImages(expectedImagePath, [img]))
      .then((x) => {
        assert.strictEqual(x.equal, true)
        assert.strictEqual(
          existsSync(mkDiffPath(imagePath)),
          false,
          'should not generate diff output',
        )
      }))

  it('should fail comparing and output diff', () =>
    Jimp.read(image2Path)
      .then((x) => x as JimpInstance)
      .then((img) => compareImages(expectedImagePath, [img]))
      .then((x) => {
        assert.strictEqual(x.equal, false)
        assert.ok(
          x.diffs && x.diffs[0] && 'diff' in x.diffs[0],
          "Expected 'diffs[0].diff' to exist",
        )
        assert.ok(
          x.diffs && x.diffs[0] && 'page' in x.diffs[0],
          "Expected 'diffs[0].page' to exist",
        )
      }))
})
