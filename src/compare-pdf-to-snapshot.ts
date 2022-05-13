import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { pdf2png } from './pdf2png'
import { compareImages, CompareImagesOpts, HighlightColor } from './compare-images'
import { drawRectangle } from './drawing'

export type RectangleMask = Readonly<{
  type: 'rectangle-mask'
  x: number
  y: number
  width: number
  height: number
  color: HighlightColor
}>

export type MaskRegions = ReadonlyArray<RectangleMask>

const maskImgWithRegions = (imagePath: string, regions: MaskRegions): Promise<void> => {
  return regions.reduce(
    (acc, { type, x, y, width, height, color }) =>
      acc.then(() =>
        type === 'rectangle-mask'
          ? drawRectangle(imagePath, x, y, x + width, y + height, color)
          : undefined,
      ),
    Promise.resolve(),
  )
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
 * @param compareOptions - settings for image comparation
 * @param compareOptions.highlightColor - color for differences in the diff image, defaults to Black
 * @param compareOptions.highlightStyle - highlight style as documented by the {@link http://www.graphicsmagick.org/GraphicsMagick.html#details-highlight-style gm package}, defaults to Tint
 * @param compareOptions.tolerance - number value for error tolerance, defaults to 0
 * @param compareOptions.writeDiff - flag to enable/disable diff file creation, defaults to true
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
    return pdf2png(pdf, snapshotPath)
      .then(() => maskImgWithRegions(snapshotPath, maskRegions || []))
      .then(() => true)
  }

  const newSnapshotPath = join(dir, snapshotName + '.new.png')
  return pdf2png(pdf, newSnapshotPath)
    .then(() => maskImgWithRegions(newSnapshotPath, maskRegions || []))
    .then(() =>
      compareImages(newSnapshotPath, snapshotPath, restOpts).then((areEqual) => {
        if (areEqual === true) {
          unlinkSync(newSnapshotPath)
          const diffSnapshotPath = join(dir, snapshotName + '.diff.png')
          if (existsSync(diffSnapshotPath)) {
            unlinkSync(diffSnapshotPath)
          }
        }
        return areEqual
      }),
    )
}
