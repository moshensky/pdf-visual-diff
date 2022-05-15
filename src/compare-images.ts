import Jimp, { read } from 'jimp'
import { mergeImages } from './merge-images'

const diffToken = '.diff'
export const mkDiffPath = (path: string): string => {
  const dotIndex = path.lastIndexOf('.')
  return dotIndex === -1
    ? path + diffToken
    : path.substring(0, dotIndex) + diffToken + path.substring(dotIndex)
}

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

export type CompareImagesOpts = {
  tolerance: number
}

const defaultOpts: CompareImagesOpts = {
  tolerance: 0,
}

type CompareOK = {
  equal: true
}

type CompareKO = {
  equal: false
  diffs: ReadonlyArray<{
    page: number
    diff: Jimp
  }>
}

type CompareImagesResult = CompareOK | CompareKO

export const compareImages = async (
  expectedImagePath: string,
  images: ReadonlyArray<Jimp>,
  compareImagesOpts: Partial<CompareImagesOpts> = {},
): Promise<CompareImagesResult> => {
  const { tolerance } = {
    ...defaultOpts,
    ...compareImagesOpts,
  }
  const expectedImg = await read(expectedImagePath)
  // Multi image comparison not implemented!
  const img = mergeImages(images)
  const diff = Jimp.diff(expectedImg, img, tolerance)
  if (diff.percent > 0) {
    return {
      equal: false,
      diffs: [{ page: 1, diff: diff.image }],
    }
  }

  return { equal: true }
}
