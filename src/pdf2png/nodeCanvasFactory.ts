import * as Canvas from 'canvas'
import * as assert from 'assert'

export type CanvasAndContext = {
  context: Canvas.CanvasRenderingContext2D
  set: (width: number, height: number) => void
  destroy: () => void
}

export function mkCanvas(): CanvasAndContext {
  let canvas = Canvas.createCanvas(1, 1)
  let context = canvas.getContext('2d')
  return {
    context,
    set: (width: number, height: number): void => {
      assert.ok(width > 0 && height > 0, 'Invalid canvas size')
      canvas.width = width
      canvas.height = height
    },
    destroy: () => {
      canvas.width = 0
      canvas.height = 0
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      canvas = null
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      context = null
    },
  }
}
