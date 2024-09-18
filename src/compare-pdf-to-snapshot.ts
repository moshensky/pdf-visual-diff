import * as path from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { pdf2png } from './pdf2png/pdf2png'
import { compareImages } from './compare-images'
import { Jimp, JimpInstance } from 'jimp'
import { PdfToPngOptions } from './types'
import { writeImages } from './imageUtils'

/**
 * Represents the available colors for highlighting.
 */
export type HighlightColor =
  | 'Red'
  | 'Green'
  | 'Blue'
  | 'White'
  | 'Cyan'
  | 'Magenta'
  | 'Yellow'
  | 'Black'
  | 'Gray'

/**
 * Represents a rectangular mask applied at the PNG level, i.e., after the
 * conversion of the PDF to an image.
 *
 * @remarks
 * The values provided for `x`, `y`, `width`, and `height` are expected to be in
 * pixels and based on the generated image by the library.
 * The origin (0,0) of the PNG's coordinate system is the top-left corner of the
 * image.
 */
export type RectangleMask = Readonly<{
  type: 'rectangle-mask'
  /** The x-coordinate of the top-left corner of the rectangle in pixels. */
  x: number
  /** The y-coordinate of the top-left corner of the rectangle in pixels. */
  y: number
  /** The width of the rectangle in pixels. */
  width: number
  /** The height of the rectangle in pixels. */
  height: number
  /** The color used for the mask. */
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
  (images: ReadonlyArray<JimpInstance>): ReadonlyArray<JimpInstance> => {
    images.forEach((img, idx) => {
      ;(maskRegions(idx + 1) || []).forEach(({ type, x, y, width, height, color }) => {
        if (type === 'rectangle-mask') {
          img.composite(new Jimp({ width, height, color: colorToNum[color] }), x, y)
        }
      })
    })

    return images
  }

/**
 * The options type for {@link comparePdfToSnapshot}.
 *
 * @privateRemarks
 * Explicitly not using `Partial`. It doesn't play nice with TypeDoc.
 * Instead of showing the type name in the docs a Partial with all the
 * fields is inlined.
 */
export type CompareOptions = {
  /**
   * Number value for error tolerance in the range [0, 1].
   *
   * @defaultValue 0
   */
  tolerance?: number
  /** {@inheritDoc MaskRegions} */
  maskRegions?: MaskRegions
  /** {@inheritDoc PdfToPngOptions} */
  pdf2PngOptions?: PdfToPngOptions
  /**
   * Whether to allow creating a snapshot if it's missing.
   *
   * @defaultValue true
   */
  allowSnapshotCreation?: boolean
  /**
   * Whether a missing snapshot should cause the comparison to fail.
   *
   * @defaultValue false
   */
  failOnMissingSnapshot?: boolean
}

export const snapshotsDirName = '__snapshots__'

/**
 * Compares a PDF to a persisted snapshot. The behavior when a snapshot does not
 * exist can be controlled via the `allowSnapshotCreation` and `failOnMissingSnapshot` options.
 *
 * @remarks
 * When the function is executed, it has the following **side effects**:
 * - If a previous snapshot file does not exist:
 *   - If `allowSnapshotCreation` is `true` (default), the PDF is converted to an image,
 *     saved as a snapshot, and the function returns `true`.
 *   - If `allowSnapshotCreation` is `false` and `failOnMissingSnapshot` is `true`,
 *     the function returns `false` without generating a new snapshot.
 *   - If `allowSnapshotCreation` is `false` and `failOnMissingSnapshot` is `false`
 *     (default), the function returns `true` without generating a new snapshot.
 * - If a snapshot exists, the PDF is converted to an image and compared to the snapshot:
 *   - If they differ, the function returns `false` and creates two additional images
 *     next to the snapshot: one with the suffix `new` (the current view of the PDF as an image)
 *     and one with the suffix `diff` (showing the difference between the snapshot and the `new` image).
 *   - If they are equal, the function returns `true`. If `new` and `diff` versions are present, they are deleted.
 *
 * @param pdf - Path to the PDF file or a Buffer containing the PDF.
 * @param snapshotDir - Path to the directory where the `__snapshots__` folder will be created.
 * @param snapshotName - Unique name for the snapshot within the specified path.
 * @param options - Options for comparison, including tolerance, mask regions, and behavior
 * regarding missing snapshots. See {@link CompareOptions} for more details.
 *
 * @returns
 * A promise that resolves to `true` if the PDF matches the snapshot or if the behavior
 * for a missing snapshot is configured to allow it. Returns `false` if the PDF differs
 * from the snapshot or if `failOnMissingSnapshot` is `true` and the snapshot is missing.
 */
export function comparePdfToSnapshot(
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  options?: CompareOptions,
): Promise<boolean> {
  const {
    maskRegions = () => [],
    pdf2PngOptions,
    allowSnapshotCreation = true,
    failOnMissingSnapshot = false,
    ...restOpts
  } = options || {}
  const dir = path.join(snapshotDir, snapshotsDirName)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const snapshotPath = path.join(dir, snapshotName + '.png')

  // If the snapshot doesn't exist
  if (!existsSync(snapshotPath)) {
    // If we shouldn't generate a snapshot, handle based on failIfSnapshotMissing
    if (!allowSnapshotCreation) {
      return Promise.resolve(!failOnMissingSnapshot)
    }

    // Proceed with snapshot generation
    return pdf2png(pdf, pdf2PngOptions)
      .then(maskImgWithRegions(maskRegions))
      .then(writeImages(snapshotPath))
      .then(() => true)
  }

  // If the snapshot exists, perform comparison
  return pdf2png(pdf, pdf2PngOptions)
    .then(maskImgWithRegions(maskRegions))
    .then((images) =>
      compareImages(snapshotPath, images, restOpts).then((result) => {
        const diffSnapshotPath = path.join(dir, snapshotName + '.diff.png')
        if (result.equal) {
          if (existsSync(diffSnapshotPath)) {
            unlinkSync(diffSnapshotPath)
          }
          return true
        }

        const newSnapshotPath = path.join(dir, snapshotName + '.new.png')
        return writeImages(newSnapshotPath)(images)
          .then(() => writeImages(diffSnapshotPath)(result.diffs.map((x) => x.diff)))
          .then(() => false)
      }),
    )
}
