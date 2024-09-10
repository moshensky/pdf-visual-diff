import { Jimp, diff as jimpDiff, JimpInstance } from 'jimp'
import { mergeImages } from './imageUtils'

const diffToken = '.diff'
export const mkDiffPath = (path: string): string => {
  const dotIndex = path.lastIndexOf('.')
  return dotIndex === -1
    ? path + diffToken
    : path.substring(0, dotIndex) + diffToken + path.substring(dotIndex)
}

/** The options type for {@link compareImages}. */
export type CompareImagesOpts = {
  tolerance?: number
}

const defaultOpts: Required<CompareImagesOpts> = {
  tolerance: 0,
}

type CompareOK = {
  equal: true
}

type CompareKO = {
  equal: false
  diffs: ReadonlyArray<{
    page: number
    diff: JimpInstance
  }>
}

type CompareImagesResult = CompareOK | CompareKO

export const compareImages = async (
  expectedImagePath: string,
  images: ReadonlyArray<JimpInstance>,
  options?: CompareImagesOpts,
): Promise<CompareImagesResult> => {
  const { tolerance } = {
    ...defaultOpts,
    ...options,
  }
  // @ts-expect-error it is a Jimp
  const expectedImg: JimpInstance = await Jimp.read(expectedImagePath)
  // Multi image comparison not implemented!
  const img = mergeImages(images)
  const diff = jimpDiff(expectedImg, img, tolerance)
  if (diff.percent > 0) {
    return {
      equal: false,
      diffs: [{ page: 1, diff: diff.image }],
    }
  }

  return { equal: true }
}
