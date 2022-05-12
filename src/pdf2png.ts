import * as Canvas from 'canvas'
import * as assert from 'assert'
import * as fs from 'fs'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import { join } from 'path'

type CanvasAndContext = {
  canvas: Canvas.Canvas
  context: Canvas.CanvasRenderingContext2D
}

class NodeCanvasFactory {
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

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
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

// Some PDFs need external cmaps.
const CMAP_URL = '../node_modules/pdfjs-dist/cmaps/'
const CMAP_PACKED = true

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL = '../node_modules/pdfjs-dist/standard_fonts/'

// Loading file from file system into typed array.
console.log(__dirname)
const pdfPath = './test-data/single-page-small.pdf'
const data = new Uint8Array(fs.readFileSync(join(__dirname, pdfPath)))

// Load the PDF file.
const loadingTask = pdfjsLib.getDocument({
  data,
  cMapUrl: CMAP_URL,
  cMapPacked: CMAP_PACKED,
  standardFontDataUrl: STANDARD_FONT_DATA_URL,
})

export async function pdf2png(): Promise<void> {
  try {
    const pdfDocument = await loadingTask.promise
    console.log('# PDF document loaded.')
    // Get the first page.
    const page = await pdfDocument.getPage(1)
    // Render the page on a Node canvas with 100% scale.
    const viewport = page.getViewport({ scale: 1.0 })
    const canvasFactory = new NodeCanvasFactory()
    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)
    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
      canvasFactory,
    }

    const renderTask = page.render(renderContext)
    await renderTask.promise
    // Convert the canvas to an image buffer.
    const image = canvasAndContext.canvas.toBuffer()
    fs.writeFile('output.png', image, function (error) {
      if (error) {
        console.error('Error: ' + error)
      } else {
        console.log('Finished converting first page of PDF file to a PNG image.')
      }
    })
    // Release page resources.
    page.cleanup()
  } catch (reason) {
    console.log(reason)
  }
}
