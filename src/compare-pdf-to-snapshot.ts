import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { pdf2png, writeImages } from './pdf2png'
import { compareImages, CompareImagesOpts, HighlightColor } from './compare-images'
import Jimp from 'jimp'

export type RectangleMask = Readonly<{
  type: 'rectangle-mask'
  x: number
  y: number
  width: number
  height: number
  color: HighlightColor
}>

export type MaskRegions = ReadonlyArray<RectangleMask>

const colorToNum: Record<HighlightColor, number> = {
  Red: 0xff0000ff,
  Green: 0x00ff00ff,
  Blue: 0x0000ffff,
  White: 0x00000000,
  Cyan: 0x00ffffff,
  Magenta: 0xff00ffff,
  Yellow: 0xffff00ff,
  Black: 0x000000ff,
  Gray: 0xbfbfbfff,
}

const maskImgWithRegions =
  (regions: MaskRegions) =>
  (images: ReadonlyArray<Jimp>): ReadonlyArray<Jimp> => {
    // For the moment public api exposes pdf to one image generation
    if (images.length === 1) {
      const baseImage = images[0]
      regions.forEach(({ type, x, y, width, height, color }) =>
        type === 'rectangle-mask'
          ? baseImage.composite(new Jimp(width, height, colorToNum[color]), x, y)
          : undefined,
      )

      return [baseImage]
    }

    return images
  }

export type CompareOptions = CompareImagesOpts & {
  maskRegions: MaskRegions
}

export const snapshotsDirName = '__snapshots__'

/**
 * Compare pdf to persisted snapshot. If one does not exist it is created
 * @param pdf - path to pdf file or pdf loaded as Buffer
 * @param snapshotDir - path to a directory where __snapshots__ folder is going to be created
 * @param snapshotName - uniq name of a snapshot in the above path
 * @param compareOptions - image comparison options
 * @param compareOptions.tolerance - number value for error tolerance, ranges 0-1 (default: 0)
 * @param compareOptions.writeDiff - flag to enable/disable diff file creation, defaults to true
 * @param compareOptions.maskRegions - mask predefined regions, i.e. when there are parts of the pdf that change between tests
 */
export const comparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  { maskRegions, ...restOpts }: Partial<CompareOptions> = {},
): Promise<boolean> => {
  const dir = join(snapshotDir, snapshotsDirName)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const snapshotPath = join(dir, snapshotName + '.png')

  if (!existsSync(snapshotPath)) {
    return pdf2png(pdf)
      .then(maskImgWithRegions(maskRegions || []))
      .then(writeImages(snapshotPath))
      .then(() => true)
  }

  return pdf2png(pdf)
    .then(maskImgWithRegions(maskRegions || []))
    .then((images) =>
      compareImages(snapshotPath, images, restOpts).then((result) => {
        const diffSnapshotPath = join(dir, snapshotName + '.diff.png')
        if (result.equal) {
          if (existsSync(diffSnapshotPath)) {
            unlinkSync(diffSnapshotPath)
          }
          return true
        }

        const newSnapshotPath = join(dir, snapshotName + '.new.png')
        return writeImages(newSnapshotPath)(images).then(() =>
          result.diffs[0].diff.writeAsync(diffSnapshotPath).then(() => false),
        )
      }),
    )
}
