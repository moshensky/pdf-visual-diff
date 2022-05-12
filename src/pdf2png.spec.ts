import { pdf2png } from './pdf2png'

describe.only('pdf2png()', () => {
  // const testDataDir = join(__dirname, './test-data')
  // const expectedImage = join(testDataDir, 'sample-image-with-rectangle-expected.png')
  // const sampleImage = join(testDataDir, 'sample-image.png')
  // const resultImage = join(testDataDir, 'sample-image-with-rectangle-diff.png')

  it('should convert', () => pdf2png())
})
