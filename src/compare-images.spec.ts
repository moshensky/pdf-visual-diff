import { compareImages, mkDiffPath } from './compare-images'
import { expect } from 'chai'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import Jimp from 'jimp'

describe('mkDiffPath()', () => {
  it('should mk path with extension', () =>
    expect(mkDiffPath('some-path.ext')).to.equal('some-path.diff.ext'))

  it('should mk path with extension when starts with .', () =>
    expect(mkDiffPath('./some-path.ext')).to.equal('./some-path.diff.ext'))

  it('should handle empty', () => expect(mkDiffPath('')).to.equal('.diff'))

  it('should mk path without extension', () =>
    expect(mkDiffPath('some-path')).to.equal('some-path.diff'))
})

const expectedImageName = 'sample-image-expected.png'
const sampleImage = 'sample-image.png'
const sampleImage2 = 'sample-image-2.png'
const testDataDir = join(dirname(fileURLToPath(import.meta.url)), './test-data')
const expectedImagePath = join(testDataDir, expectedImageName)
const imagePath = join(testDataDir, sampleImage)
const image2Path = join(testDataDir, sampleImage2)

describe('compareImages()', () => {
  it('should succeed comparing', () =>
    Jimp.read(imagePath)
      .then((img) => compareImages(expectedImagePath, [img]))
      .then((x) => {
        expect(x.equal).to.be.true
        expect(existsSync(mkDiffPath(imagePath))).to.eq(false, 'should not generate diff output')
      }))

  it('should fail comparing and output diff', () =>
    Jimp.read(image2Path)
      .then((img) => compareImages(expectedImagePath, [img]))
      .then((x) => {
        expect(x.equal).to.be.false
        expect(x).to.have.nested.property('diffs[0].diff')
        expect(x).to.have.nested.property('diffs[0].page')
      }))
})
