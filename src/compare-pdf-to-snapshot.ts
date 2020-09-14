import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { pdfToImage } from './convert-pdf'
import { compareImages, CompareImagesOpts } from './compare-images'

export const snapshotsDirName = '__snapshots__'

/**
 * Compare pdf to persisted snapshot. If one does not exist it is created
 * @param pdf - path to pdf file or pdf loaded as Buffer
 * @param snapshotDir - path to a directory where __snapshots__ folder is going to be created
 * @param snapshotName - uniq name of a snapshot in the above path
 * @param compareImageOpts - settings for image comparation
 * @param compareImageOpts.highlightColor - color for differences in the diff image, defaults to Black
 * @param compareImageOpts.highlightStyle - highlight style as documented by the {@link http://www.graphicsmagick.org/GraphicsMagick.html#details-highlight-style gm package}, defaults to Tint
 * @param compareImageOpts.tolerance - number value for error tolerance, defaults to 0
 * @param compareImageOpts.writeDiff - flag to enable/disable diff file creation, defaults to true
 */
export const comparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  compareImageOpts?: Partial<CompareImagesOpts>,
): Promise<boolean> => {
  const dir = join(snapshotDir, snapshotsDirName)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const snapshotPath = join(dir, snapshotName + '.png')

  if (!existsSync(snapshotPath)) {
    return pdfToImage(pdf, snapshotPath).then(() => true)
  }

  const newSnapshotPath = join(dir, snapshotName + '.new.png')
  return pdfToImage(pdf, newSnapshotPath).then(() =>
    compareImages(newSnapshotPath, snapshotPath, compareImageOpts).then((areEqual) => {
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
