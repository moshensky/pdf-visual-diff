import { compare, CompareOptions, HighlightStyle } from './compare'

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
  highlightColor: HighlightColor
  highlightStyle: HighlightStyle
  tolerance: number
  writeDiff: boolean
}

const defaultOpts: CompareImagesOpts = {
  highlightColor: 'Black',
  highlightStyle: 'Tint',
  tolerance: 0,
  writeDiff: true,
}

export const compareImages = (
  expectedImagePath: string,
  resultImagePath: string,
  compareImagesOpts: Partial<CompareImagesOpts> = {},
): Promise<boolean> => {
  const { tolerance, writeDiff, highlightColor, highlightStyle } = {
    ...defaultOpts,
    ...compareImagesOpts,
  }
  return compare(expectedImagePath, resultImagePath, { tolerance }).then((isEqual) => {
    if (writeDiff === true && isEqual === false) {
      const options: CompareOptions = {
        file: mkDiffPath(resultImagePath),
        highlightColor,
        highlightStyle,
        tolerance,
      }
      return compare(expectedImagePath, resultImagePath, options)
    }

    return isEqual
  })
}
