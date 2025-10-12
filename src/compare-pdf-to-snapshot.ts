import * as path from 'node:path'
import { access, mkdir, unlink, readdir } from 'node:fs/promises'
import { pdf2png } from './pdf2png/pdf2png'
import { compareImages } from './compare-images'
import { Jimp, JimpInstance } from 'jimp'
import { Dpi, PdfToPngOptions } from './types'
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
   * Whether to combine all pages into a single image.
   *
   * @defaultValue true
   */
  combinePages?: boolean
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
   * Whether a missing snapshot should cause the comparison to fail.
   *
   * @defaultValue false
   */
  failOnMissingSnapshot?: boolean
}

/**
 * Compares a PDF to a persisted snapshot, with behavior for handling missing snapshots
 * controlled by the `failOnMissingSnapshot` option.
 *
 * @remarks
 * The function has the following **side effects**:
 * - If no snapshot exists:
 *   - If `failOnMissingSnapshot` is `false` (default), the PDF is converted to an image,
 *     saved as a new snapshot, and the function returns `true`.
 *   - If `failOnMissingSnapshot` is `true`, the function returns `false` without creating a new snapshot.
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
 * allows for missing snapshots. Resolves to `false` if the PDF differs from the snapshot
 * or if `failOnMissingSnapshot` is `true` and no snapshot exists.
 */
export async function comparePdfToSnapshot(
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  options?: CompareOptions,
): Promise<boolean> {
  const mergedOptions = mergeOptionsWithDefaults(options)
  const snapshotContext = await createSnapshotContext(snapshotDir, snapshotName, mergedOptions)

  // When combinePages is false, we need to process each page as a separate context
  if (Array.isArray(snapshotContext)) {
    try {
      // Ensure snapshots exists for all pages. If any are missing, we
      // should re-generate all of them.
      for (const context of snapshotContext) {
        await access(context.path)
      }

      return compareWithSnapshot(pdf, snapshotContext, mergedOptions)
    } catch {
      return handleMissingSnapshot(pdf, snapshotContext[0], mergedOptions)
    }
  }

  // Check if snapshot exits and handle accordingly
  try {
    await access(snapshotContext.path)
    return compareWithSnapshot(pdf, snapshotContext, mergedOptions)
  } catch {
    return handleMissingSnapshot(pdf, snapshotContext, mergedOptions)
  }
}

type SnapshotContext = {
  name: string
  dirPath: string
  path: string
  diffPath: string
  newPath: string
}

function mergeOptionsWithDefaults(options?: CompareOptions): Required<CompareOptions> {
  return {
    combinePages: options?.combinePages ?? true,
    maskRegions: options?.maskRegions ?? (() => []),
    pdf2PngOptions: options?.pdf2PngOptions ?? { dpi: Dpi.High },
    failOnMissingSnapshot: options?.failOnMissingSnapshot ?? false,
    tolerance: options?.tolerance ?? 0,
  }
}

export const SNAPSHOTS_DIR_NAME = '__snapshots__'
/**
 * @deprecated Use SNAPSHOTS_DIR_NAME instead.
 */
export const snapshotsDirName = SNAPSHOTS_DIR_NAME

/** Generates the snapshot context and creates the folder if it doesn’t already exist. */
async function createSnapshotContext(
  snapshotDir: string,
  snapshotName: string,
  options: Required<CompareOptions>,
): Promise<SnapshotContext | Array<SnapshotContext>> {
  const dirPath = path.join(snapshotDir, SNAPSHOTS_DIR_NAME)
  try {
    await access(dirPath)
  } catch {
    await mkdir(dirPath, { recursive: true })
  }

  const basePath = path.join(dirPath, snapshotName)

  // When combinePages is false, we need to create a separate snapshot for each page
  if (options.combinePages === false) {
    const files = await readdir(dirPath)
    return files.filter((file: string) => file.startsWith(snapshotName)).map((file: string) => {
      const fileNameWithoutExt = file.substring(0, file.lastIndexOf('.'))
      return ({
        name: snapshotName,
        dirPath,
        path: path.join(dirPath, file),
        diffPath: path.join(dirPath, `${fileNameWithoutExt}.diff.png`),
        newPath: path.join(dirPath, `${fileNameWithoutExt}.new.png`),
      })
    })
  }

  return {
    name: snapshotName,
    dirPath,
    path: `${basePath}.png`,
    diffPath: `${basePath}.diff.png`,
    newPath: `${basePath}.new.png`,
  }
}

async function handleMissingSnapshot(
  pdf: string | Buffer,
  snapshotContext: SnapshotContext,
  { combinePages, failOnMissingSnapshot, maskRegions, pdf2PngOptions }: Required<CompareOptions>,
): Promise<boolean> {
  if (failOnMissingSnapshot) {
    return false
  }

  // Generate snapshot if missing
  const images = await pdf2png(pdf, pdf2PngOptions).then(maskImgWithRegions(maskRegions))
  await writeImages(snapshotContext.path, combinePages)(images)

  return true
}

async function compareContext(
  snapshotContext: SnapshotContext,
  images: ReadonlyArray<JimpInstance>,
  { combinePages, tolerance }: Required<CompareOptions>
) {
  const result = await compareImages(snapshotContext.path, images, { tolerance })

  if (result.equal) {
    await removeIfExists(snapshotContext.diffPath)
    await removeIfExists(snapshotContext.newPath)
    return true
  }

  await writeImages(snapshotContext.newPath, combinePages)(images)
  await writeImages(snapshotContext.diffPath, combinePages)(result.diffs.map((x) => x.diff))

  return false
}

async function compareWithSnapshot(
  pdf: string | Buffer,
  snapshotContext: SnapshotContext | Array<SnapshotContext>,
  options: Required<CompareOptions>,
): Promise<boolean> {
  const { maskRegions, pdf2PngOptions } = options;
  const images = await pdf2png(pdf, pdf2PngOptions).then(maskImgWithRegions(maskRegions))

  if (Array.isArray(snapshotContext)) {
    let results: Array<Promise<boolean>> = [];
    for (let i = 0, l = snapshotContext.length; i < l; i++) {
      results.push(compareContext(snapshotContext[i], [images[i]], options));
    }

    return (await Promise.all(results)).every((result) => result)
  }
  
  return await compareContext(snapshotContext, images, options)
}

async function removeIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch {
    // File doesn't exist, no need to remove
  }
}
