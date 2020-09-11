import { spawn } from 'child_process'

export type HighlightStyle = 'Assign' | 'Threshold' | 'Tint' | 'XOR'
export type CompareOptions = Readonly<{
  file?: string
  highlightColor?: string
  highlightStyle?: HighlightStyle
  tolerance: number
}>

export function compare(
  orig: string,
  compareTo: string,
  options: CompareOptions,
): Promise<boolean> {
  const args = ['compare', '-metric', 'mse', orig, compareTo]
  // outputting the diff image
  if (options.file) {
    if (typeof options.file !== 'string') {
      throw new TypeError('The path for the diff output is invalid')
    }
    if (options.highlightColor) {
      args.push('-highlight-color')
      args.push(options.highlightColor)
    }
    if (options.highlightStyle) {
      args.push('-highlight-style')
      args.push(options.highlightStyle)
    }

    args.push('-file')
    args.push(options.file)
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('gm', args)
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => {
      stdout += data
    })
    proc.stderr.on('data', (data) => {
      stderr += data
    })
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(stderr)
      }

      const regex = /Total: (\d+\.?\d*)/m
      const match = regex.exec(stdout)
      if (!match) {
        const err = new Error('Unable to parse output.\nGot ' + stdout)
        return reject(err)
      }

      const equality = parseFloat(match[1])
      resolve(equality <= options.tolerance)
    })
  })
}
