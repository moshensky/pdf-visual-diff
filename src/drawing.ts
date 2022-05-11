import { spawn } from 'child_process'

export function drawRectangle(
  imgFilePath: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  newFilePath?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('gm', [
      'convert',
      '-fill',
      color,
      '-draw',
      `rectangle ${x0},${y0},${x1},${y1}`,
      imgFilePath,
      ...(newFilePath ? [newFilePath] : [imgFilePath]),
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
  })
}
