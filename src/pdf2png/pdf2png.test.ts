import { describe, it } from 'node:test'
import * as assert from 'node:assert/strict'
import { join } from 'path'
import { platform } from 'node:os'
import { pdf2png } from './pdf2png'
import { compareImages } from '../compare-images'
import { Dpi } from '../types'

// Tolerance for cross-platform font rendering differences
// Snapshots are generated on Linux, so use strict tolerance there
const isLinux = platform() === 'linux'
const crossPlatformTolerance = isLinux ? 0 : 0.05

const testDataDir = join(__dirname, '../test-data')
const pdfs = join(testDataDir, 'pdfs')
const singlePage = join(pdfs, 'single-page.pdf')
const twoPage = join(pdfs, 'two-page.pdf')
const cmaps = join(pdfs, 'cmaps.pdf')

const expectedDir = join(testDataDir, 'pdf2png-expected')

describe('pdf2png()', () => {
  it('two-page.pdf png per page with scaling', () => {
    const expectedImage1Path = join(expectedDir, 'two-page_png_per_page_scaled_1.png')
    const expectedImage2Path = join(expectedDir, 'two-page_png_per_page_scaled_2.png')
    return pdf2png(twoPage, { dpi: Dpi.High })
      .then((imgs) => {
        return Promise.all([
          compareImages(expectedImage1Path, [imgs[0]]),
          compareImages(expectedImage2Path, [imgs[1]]),
        ])
      })
      .then((results) => {
        results.forEach((x) => assert.strictEqual(x.equal, true))
      })
  })

  it('two-page.pdf png per page and without scaling', () => {
    const expectedImage1Path = join(expectedDir, 'two-page_png_per_page_1.png')
    const expectedImage2Path = join(expectedDir, 'two-page_png_per_page_2.png')
    return pdf2png(twoPage, { dpi: Dpi.Low })
      .then((imgs) => {
        return Promise.all([
          compareImages(expectedImage1Path, [imgs[0]]),
          compareImages(expectedImage2Path, [imgs[1]]),
        ])
      })
      .then((results) => {
        results.forEach((x) => assert.strictEqual(x.equal, true))
      })
  })

  it('should scale using custom DPI', () => {
    const expectedImagePath = join(expectedDir, 'should_scale_using_custom_DPI.png')
    return pdf2png(singlePage, { dpi: 200 })
      .then((imgs) => compareImages(expectedImagePath, imgs))
      .then((result) => assert.strictEqual(result.equal, true))
  })

  it('pdf that requires cmaps', async () => {
    const expectedImagePath = join(expectedDir, 'cmaps.png')
    const imgs = await pdf2png(cmaps)
    const result = await compareImages(expectedImagePath, imgs, { tolerance: crossPlatformTolerance })
    assert.strictEqual(result.equal, true)
  })
})
