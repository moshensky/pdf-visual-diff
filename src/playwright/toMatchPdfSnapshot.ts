import { expect } from '@playwright/test'
import { pdf2png } from '../pdf2png'
import { maskImgWithRegions, MaskRegions } from '../compare-pdf-to-snapshot'
import Jimp from 'jimp'

type ToMatchSnapShotOptions = {
  /**
   * An acceptable ratio of pixels that are different to the total amount of pixels, between `0` and `1`. Default is
   * configurable with `TestConfig.expect`. Unset by default.
   */
  maxDiffPixelRatio?: number

  /**
   * An acceptable amount of pixels that could be different. Default is configurable with `TestConfig.expect`. Unset by
   * default.
   */
  maxDiffPixels?: number

  /**
   * Snapshot name. If not passed, the test name and ordinals are used when called multiple times.
   */
  name: string

  /**
   * An acceptable perceived color difference in the [YIQ color space](https://en.wikipedia.org/wiki/YIQ) between the
   * same pixel in compared images, between zero (strict) and one (lax), default is configurable with
   * `TestConfig.expect`. Defaults to `0.2`.
   */
  threshold?: number
}

type CompareOptions = ToMatchSnapShotOptions & {
  maskRegions?: MaskRegions
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    interface Matchers<R> {
      toMatchPdfSnapshot(options: CompareOptions): R
    }
  }
}

expect.extend({
  async toMatchPdfSnapshot(
    pdfFile: string | Buffer,
    { maskRegions = () => [], name, ...restOpts }: CompareOptions,
  ) {
    if (!name) {
      throw new Error('"name" option is required!')
    }
    const images = await pdf2png(pdfFile).then(maskImgWithRegions(maskRegions))

    let pass = true
    const nameParts = name.split('.')
    // Remove extension
    nameParts.pop()

    const addIndex = images.length > 1

    await Promise.all(
      images.map(async (image, index) => {
        try {
          expect(await image.getBufferAsync(Jimp.MIME_PNG)).toMatchSnapshot({
            ...restOpts,
            name: `${nameParts.join('.')}${addIndex ? `-${index}` : ''}.png`,
          })
        } catch {
          pass = false
        }
      }),
    )

    return {
      pass,
      name: 'toMatchPdfSnapshot',
      message: () => 'Does not match with snapshot.',
    }
  },
})
