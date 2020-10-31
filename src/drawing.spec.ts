import { drawRectangle } from './drawing'
import { join } from 'path'
import { expect } from 'chai'
import { unlinkSync } from 'fs'
import { compareImages } from './compare-images'

describe('drawRectangle()', () => {
  const testDataDir = join(__dirname, './test-data')
  const expectedImage = join(testDataDir, 'sample-image-with-rectangle-expected.png')
  const sampleImage = join(testDataDir, 'sample-image.png')
  const resultImage = join(testDataDir, 'sample-image-with-rectangle-diff.png')
  it.only('should create rectangle on an image', () =>
    drawRectangle(sampleImage, 10, 10, 200, 200, 'black', resultImage)
      .then(() => compareImages(expectedImage, resultImage))
      .then((x) => {
        expect(x).to.be.true
        if (x) {
          unlinkSync(resultImage)
        }
      }))
})
