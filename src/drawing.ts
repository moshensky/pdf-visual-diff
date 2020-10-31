import gm from 'gm'

export function drawRectangle(
  imgFilePath: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  newFilePath?: string,
): Promise<void> {
  return new Promise((resolve, reject) =>
    gm(imgFilePath)
      .fill(color)
      .drawRectangle(x0, y0, x1, y1)
      .write(newFilePath || imgFilePath, (err) => (err ? reject(err) : resolve())),
  )
}
