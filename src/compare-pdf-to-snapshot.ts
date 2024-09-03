import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { pdf2png, writeImages } from './pdf2png'
import { compareImages, HighlightColor } from './compare-images'
import Jimp from 'jimp'

/**
 * Rectangle mask is applied at the PNG level, i.e., after the conversion of the
 * PDF to an image. Therefore, the values provided for `x`, `y`, `width`, and
 * `height` are expected to be in pixels and based on the generated image by the
 * library. The origin (0,0) of the PNG's coordinate system is the top-left
 * corner of the image.
 */
export type RectangleMask = Readonly<{
  type: 'rectangle-mask'
  x: number
  y: number
  width: number
  height: number
  color: HighlightColor
}>

export type RegionMask = RectangleMask

/**
 * Defines a function for masking predefined regions per page, useful for
 * parts of the PDF that change between tests.
 *
 * @param page - The page number of the PDF.
 * @returns An array of region masks for the specified page, or undefined if no masks are defined.
 */
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

export type CompareOptions = Partial<{
  // FIXME: import definition from CompareImgOpts
  /**
   * Number value for error tolerance, ranging from 0-1 (inclusive).
   *
   * @defaultValue 0
   */
  tolerance: number
  // FIXME: import definition from the type
  maskRegions: MaskRegions
}>

export const snapshotsDirName = '__snapshots__'

/**
 * Compares a PDF to a persisted snapshot. If a snapshot does not exists, one is
 * created.
 *
 * @remarks
 * When the function is executed, it has following **side effects**:
 * - If a previous snapshot file does not exist, the PDF is converted to an
 *   image, saved as a snapshot, and the function returns `true`.
 * - If a snapshot exists, the PDF is converted to an image and compared to the
 *   snapshot:
 *   - If they differ, the function returns `false` and creates two additional
 *     images next to the snapshot: one with the suffix `new` (the current view
 *     of the PDF as an image) and one with the suffix `diff` (showing the
 *     difference between the snapshot and the `new` image).
 *   - If they are equal, the function returns `true`. If `new` and `diff`
 *     versions are present, they are deleted.
 *
 * @param pdf - Path to the PDF file or a Buffer containing the PDF
 * @param snapshotDir - Path to the directory where `__snapshots__` folder will
 * be created
 * @param snapshotName - Unique name for the snapshot within the specified path
 * @param compareOptions - Options for image comparison
 * @returns A promise that resolves to `true` if the PDF matches the snapshot or
 * if a new snapshot is created, and `false` if the PDF differs from the snapshot.
 */
export const comparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  { maskRegions = () => [], ...restOpts }: CompareOptions = {},
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
