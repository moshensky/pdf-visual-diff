import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { spawn } from 'child_process'

const isString = (x: unknown): x is string => typeof x === 'string' || x instanceof String

export const pdfToImage = (pdf: string | Buffer, outputImagePath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn('gm', [
      'convert',
      '-density',
      '300',
      '-append',
      isString(pdf) ? pdf : '-',
      outputImagePath,
    ])
    let stderr = ''
    proc.stderr.on('data', (data) => {
      stderr += data
    })
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(stderr)
      }

      resolve()
    })

    if (Buffer.isBuffer(pdf)) {
      proc.stdin.write(pdf)
      proc.stdin.end()
    }
  })

export const pdfToImages = (
  pdf: string | Buffer,
  outputDir: string,
  fileName: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir)
    }

    const proc = spawn('gm', [
      'convert',
      '-density',
      '300',
      '+adjoin',
      isString(pdf) ? pdf : '-',
      `${join(outputDir, fileName)}%03d.png`,
    ])
    let stderr = ''
    proc.stderr.on('data', (data) => {
      stderr += data
    })
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(stderr)
      }

      resolve()
    })

    if (Buffer.isBuffer(pdf)) {
      proc.stdin.write(pdf)
      proc.stdin.end()
    }
  })
