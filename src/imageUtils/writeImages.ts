import * as Jimp from 'jimp'
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
  (images: ReadonlyArray<Jimp>): Promise<void> => {
    if (combinePages === true) {
      return mergeImages(images)
        .writeAsync(outputImagePath)
        .then(() => undefined)
    }

    const parsedPath = path.parse(outputImagePath)
    const partialName = path.join(parsedPath.dir, parsedPath.name)
    const padMaxLen = images.length.toString().length
    return Promise.all(
      images.map((img, idx) =>
        img.writeAsync(`${partialName}_${String(idx + 1).padStart(padMaxLen, '0')}.png`),
      ),
    ).then(() => undefined)
  }
