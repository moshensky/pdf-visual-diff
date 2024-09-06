import * as Canvas from 'canvas'
import * as assert from 'assert'

export type CanvasAndContext = {
  canvas: Canvas.Canvas
  context: Canvas.CanvasRenderingContext2D
}

export class NodeCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    assert.ok(width > 0 && height > 0, 'Invalid canvas size')
    const canvas = Canvas.createCanvas(width, height)
    const context = canvas.getContext('2d')
    return {
      canvas,
      context,
    }
  }

  reset(canvasAndContext: CanvasAndContext, width: number, height: number): void {
    assert.ok(canvasAndContext.canvas, 'Canvas is not specified')
    assert.ok(width > 0 && height > 0, 'Invalid canvas size')
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  }

  destroy(canvasAndContext: CanvasAndContext): void {
    assert.ok(canvasAndContext.canvas, 'Canvas is not specified')
    canvasAndContext.canvas.width = 0
    canvasAndContext.canvas.height = 0
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    canvasAndContext.canvas = null
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    canvasAndContext.context = null
  }
}
