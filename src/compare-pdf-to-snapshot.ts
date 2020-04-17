import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { pdfToImage } from './convert-pdf'
import { compareImages } from './compare-images'

export const snapshotsDirName = '__snapshots__'

/**
 * Compare pdf to persisted snapshot. If one does not exist it is created.
 */
export const comparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotName: string,
): Promise<boolean> => {
  const dir = join(__dirname, snapshotsDirName)
  if (!existsSync(dir)) {
    mkdirSync(dir)
  }

  const snapshotPath = join(dir, snapshotName + '.png')

  if (!existsSync(snapshotPath)) {
    return pdfToImage(pdf, snapshotPath).then(() => true)
  }

  const newSnapshotPath = join(dir, snapshotName + '-new.png')
  return pdfToImage(pdf, newSnapshotPath).then(() =>
    compareImages(newSnapshotPath, snapshotPath).then((x) => {
      unlinkSync(newSnapshotPath)
      return x
    }),
  )
}
