import { compare, CompareOptions, HighlightStyle } from './compare'
import { drawRectangle } from './drawing'

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
  x: number
  y: number
  width: number
  height: number
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
  const { tolerance, writeDiff, highlightColor, highlightStyle, maskRegions }: CompareImagesOpts = {
    ...defaultOpts,
    ...opts,
  }

  return maskRegions
    .reduce(
      (acc, { type, x, y, width, height, color }) =>
        acc.then(() =>
          type === 'rectangle-mask'
            ? drawRectangle(expectedImagePath, x, y, x + width, y + height, color)
            : undefined,
        ),
      Promise.resolve(),
    )
    .then(() =>
      compare(expectedImagePath, resultImagePath, { tolerance }).then((isEqual) => {
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
      }),
    )
}
