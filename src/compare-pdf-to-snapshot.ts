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

export type RegionMask = RectangleMask

export type MaskRegions = (page: number) => ReadonlyArray<RegionMask> | undefined

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
  (maskRegions: MaskRegions) =>
  (images: ReadonlyArray<Jimp>): ReadonlyArray<Jimp> => {
    images.forEach((img, idx) => {
      ;(maskRegions(idx + 1) || []).forEach(({ type, x, y, width, height, color }) => {
        if (type === 'rectangle-mask') {
          img.composite(new Jimp(width, height, colorToNum[color]), x, y)
        }
      })
    })

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
 * @param compareOptions.maskRegions - `(page: number) => ReadonlyArray<RegionMask> | undefined` mask predefined regions per page, i.e. when there are parts of the pdf that change between tests
 */
export const comparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  { maskRegions = () => [], ...restOpts }: Partial<CompareOptions> = {},
): Promise<boolean> => {
  const dir = join(snapshotDir, snapshotsDirName)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const snapshotPath = join(dir, snapshotName + '.png')

  if (!existsSync(snapshotPath)) {
    return pdf2png(pdf)
      .then(maskImgWithRegions(maskRegions))
      .then(writeImages(snapshotPath))
      .then(() => true)
  }

  return pdf2png(pdf)
    .then(maskImgWithRegions(maskRegions))
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
        return writeImages(newSnapshotPath)(images)
          .then(() => writeImages(diffSnapshotPath)(result.diffs.map((x) => x.diff)))
          .then(() => false)
      }),
    )
}
