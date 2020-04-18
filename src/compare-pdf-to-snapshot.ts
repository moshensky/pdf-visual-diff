import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { pdfToImage } from './convert-pdf'
import { compareImages } from './compare-images'

export const snapshotsDirName = '__snapshots__'

/**
 * Compare pdf to persisted snapshot. If one does not exist it is created
 * @param pdf - path to pdf file or pdf loaded as Buffer
 * @param snapshotDir - path to a directory where __snapshots__ folder is going to be created
 * @param snapshotName - uniq name of a snapshot in the above path
 */
export const comparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
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
    compareImages(newSnapshotPath, snapshotPath).then((areEqual) => {
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
