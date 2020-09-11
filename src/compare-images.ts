import gm, { CompareOptions } from 'gm'

const diffToken = '.diff'
export const mkDiffPath = (path: string): string => {
  const dotIndex = path.lastIndexOf('.')
  return dotIndex === -1
    ? path + diffToken
    : path.substring(0, dotIndex) + diffToken + path.substring(dotIndex)
}

export type CompareImagesOpts = {
  highlightColor:
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
  highlightStyle: 'Assign' | 'Threshold' | 'Tint' | 'XOR'
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
  opts: Partial<CompareImagesOpts> = {},
): Promise<boolean> => {
  const { tolerance, writeDiff, highlightColor, highlightStyle }: CompareImagesOpts = {
    ...defaultOpts,
    ...opts,
  }

  return new Promise((resolve, reject) => {
    gm.compare(expectedImagePath, resultImagePath, { tolerance }, (err, isEqual) => {
      if (err) {
        return reject(err)
      }

      if (isEqual === true) {
        return resolve(true)
      }

      if (writeDiff === false) {
        return resolve(false)
      }

      const options: CompareOptions = {
        file: mkDiffPath(resultImagePath),
        highlightColor,
        highlightStyle,
        tolerance,
      }
      gm.compare(expectedImagePath, resultImagePath, options, () => resolve(false))
    })
  })
}
