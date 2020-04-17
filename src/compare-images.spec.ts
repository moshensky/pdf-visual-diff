import { compareImages, mkDiffPath } from './compare-images'
import { expect } from 'chai'
import { join } from 'path'
import { existsSync } from 'fs'

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
const sampleImage3 = 'sample-image-3.png'
const testDataDir = join(__dirname, './test-data')
const expectedImagePath = join(testDataDir, expectedImageName)
const imagePath = join(testDataDir, sampleImage)
const image2Path = join(testDataDir, sampleImage2)
const image3Path = join(testDataDir, sampleImage3)

describe('compareImages()', () => {
  it('should succeed comparing', () =>
    compareImages(expectedImagePath, imagePath).then((x) => {
      expect(x).to.be.true
    }))

  it('should fail comparing and output diff', () =>
    compareImages(expectedImagePath, image2Path).then((x) => {
      expect(x).to.be.false
      expect(existsSync(mkDiffPath(image2Path))).to.be.true
    }))

  it('should fail comparing without outputting diff', () =>
    compareImages(expectedImagePath, image3Path, { writeDiff: false }).then((x) => {
      expect(x).to.be.false
      expect(existsSync(mkDiffPath(image3Path))).to.be.false
    }))
})
