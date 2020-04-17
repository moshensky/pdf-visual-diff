import { join } from 'path'
import gm from 'gm'

const isString = (x: unknown): x is string => typeof x === 'string' || x instanceof String

export const pdfToImage = (pdf: string | Buffer, outputImagePath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    gm(pdf, isString(pdf) ? undefined : 'any.pdf')
      .density(300, 300)
      .out('-append')
      .write(outputImagePath, (err) => (err ? reject(err) : resolve()))
  })

export const pdfToImages = (
  pdf: string | Buffer,
  outputDir: string,
  fileName: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    gm(pdf, isString(pdf) ? undefined : 'any.pdf')
      .density(300, 300)
      .out('+adjoin')
      .write(`${join(outputDir, fileName)}%03d.png`, (err) => (err ? reject(err) : resolve()))
  })
