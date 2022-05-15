import Jimp, { read } from 'jimp'

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
  writeDiff: boolean
}

const defaultOpts: CompareImagesOpts = {
  tolerance: 0,
  writeDiff: true,
}

export const compareImages = async (
  expectedImagePath: string,
  resultImagePath: string,
  compareImagesOpts: Partial<CompareImagesOpts> = {},
): Promise<boolean> => {
  const { tolerance, writeDiff } = {
    ...defaultOpts,
    ...compareImagesOpts,
  }
  const [img1, img2] = await Promise.all([read(expectedImagePath), read(resultImagePath)])
  const diff = Jimp.diff(img1, img2, tolerance)
  if (diff.percent > 0) {
    if (writeDiff) {
      await diff.image.writeAsync(mkDiffPath(resultImagePath))
    }
    return false
  }

  return true
}
