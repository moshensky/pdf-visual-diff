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
  | 'Opacity'
  | 'Matte'
  | 'Cyan'
  | 'Magenta'
  | 'Yellow'
  | 'Black'
  | 'Gray'

export type RectangleMask = Readonly<{
  type: 'rectangle-mask'
  x0: number
  y0: number
  x1: number
  y1: number
  color: HighlightColor
}>

export type MaskRegions = ReadonlyArray<RectangleMask>

export type CompareImagesOpts = {
  highlightColor: HighlightColor
  highlightStyle: HighlightStyle
  tolerance: number
  writeDiff: boolean
  maskRegions: MaskRegions
}

const defaultOpts: CompareImagesOpts = {
  highlightColor: 'Black',
  highlightStyle: 'Tint',
  tolerance: 0,
  writeDiff: true,
  maskRegions: [],
}

export const compareImages = (
  expectedImagePath: string,
  resultImagePath: string,
  opts: Partial<CompareImagesOpts> = {},
): Promise<boolean> => {
  const { tolerance, writeDiff, highlightColor, highlightStyle }: CompareImagesOpts = {
    ...defaultOpts,
    ...opts,
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
