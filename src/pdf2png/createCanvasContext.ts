import * as Canvas from 'canvas'
import * as assert from 'node:assert'

export type CanvasContextManager = {
  context: Canvas.CanvasRenderingContext2D
  resize: (width: number, height: number) => void
  toPngBuffer: () => Buffer
  toImageData: () => Canvas.ImageData
  dispose: () => void
}

export function createCanvasContext(): CanvasContextManager {
  let canvas = Canvas.createCanvas(1, 1)
  let context = canvas.getContext('2d')

  return {
    context,
    resize: (width: number, height: number): void => {
      assert(width > 0 && height > 0, 'Invalid canvas dimensions')
      canvas.width = width
      canvas.height = height
    },
    toPngBuffer: () => canvas.toBuffer('image/png'),
    toImageData: () => context.getImageData(0, 0, canvas.width, canvas.height),
    dispose: () => {
      canvas.width = 0
      canvas.height = 0
      // Nullify for garbage collection
      canvas = null as unknown as Canvas.Canvas
      context = null as unknown as Canvas.CanvasRenderingContext2D
    },
  }
}
