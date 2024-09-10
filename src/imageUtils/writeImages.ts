import { JimpInstance } from 'jimp'
import * as path from 'path'
import { mergeImages } from './mergeImages'

/**
 * Writes images to the specified output path.
 *
 * @returns A function that takes an array of Jimp images and returns a promise that resolves to void.
 */
export const writeImages =
  (
    /** The path where the images will be saved. */
    outputImagePath: string,
    /**
     * Whether to combine all images into a single image.
     * @defaultValue true
     */
    combinePages = true,
  ) =>
  (images: ReadonlyArray<JimpInstance>): Promise<void> => {
    if (combinePages === true) {
      // @ts-expect-error too smart types
      const outputImagePath0: `${string}.${string}` = outputImagePath
      return mergeImages(images).write(outputImagePath0)
    }

    const parsedPath = path.parse(outputImagePath)
    const partialName = path.join(parsedPath.dir, parsedPath.name)
    const padMaxLen = images.length.toString().length
    return Promise.all(
      images.map((img, idx) =>
        img.write(`${partialName}_${String(idx + 1).padStart(padMaxLen, '0')}.png`),
      ),
    ).then(() => undefined)
  }
