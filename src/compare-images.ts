import gm from 'gm'

const diffToken = '.diff'
export const mkDiffPath = (path: string): string => {
  const dotIndex = path.lastIndexOf('.')
  return dotIndex === -1
    ? path + diffToken
    : path.substring(0, dotIndex) + diffToken + path.substring(dotIndex)
}

export type CompareImagesOpts = {
  tolerance: number
  writeDiff: boolean
}

const defaultOpts: CompareImagesOpts = {
  tolerance: 0,
  writeDiff: true,
}

export const compareImages = (
  expectedImagePath: string,
  resultImagePath: string,
  opts: Partial<CompareImagesOpts> = {},
): Promise<boolean> => {
  const { tolerance, writeDiff }: CompareImagesOpts = {
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

      const options = {
        file: mkDiffPath(resultImagePath),
        highlightColor: 'yellow',
        tolerance,
      }
      gm.compare(expectedImagePath, resultImagePath, options, () => resolve(false))
    })
  })
}
