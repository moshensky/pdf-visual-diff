import * as Canvas from 'canvas'
import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

function convertFromMmToPx(sizeMm: number, dpi: number): number {
  if (sizeMm <= 0 || dpi <= 0) {
    return 0
  }
  const sizeInch = sizeMm / 25.4
  return Math.round(sizeInch * dpi)
}
function convertFromPxToMm(sizePx: number, dpi: number): number {
  if (sizePx <= 0 || dpi <= 0) {
    return 0
  }
  const sizeInch = sizePx / dpi
  return Math.round(sizeInch * 25.4)
}

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
const CMAP_URL = path.join(__dirname, '../node_modules/pdfjs-dist/cmaps/')
const CMAP_PACKED = true

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL = path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/')

type Pdf2PngOpts = Readonly<{
  // slower, but better resolution
  scaleImage: boolean
}>

const pdf2PngDefOpts: Pdf2PngOpts = {
  scaleImage: true,
}

function getPageViewPort(page: pdfjsLib.PDFPageProxy, scaleImage: boolean): pdfjsLib.PageViewport {
  const viewport = page.getViewport({ scale: 1.0 })
  if (scaleImage === false) {
    return viewport
  }

  // Increase resolution
  const horizontalMm = convertFromPxToMm(viewport.width, 72)
  const verticalMm = convertFromPxToMm(viewport.height, 72)
  const actualWidth = convertFromMmToPx(horizontalMm, 300)
  const actualHeight = convertFromMmToPx(verticalMm, 300)
  const scale = Math.min(actualWidth / viewport.width, actualHeight / viewport.height)
  return page.getViewport({ scale })
}

export async function pdf2png(
  pdf: string | Buffer,
  outputImagePath: string,
  options: Partial<Pdf2PngOpts> = {},
): Promise<void> {
  const opts = {
    ...pdf2PngDefOpts,
    ...options,
  }
  // Loading file from file system into typed array.
  const data = new Uint8Array(Buffer.isBuffer(pdf) ? pdf : fs.readFileSync(pdf))

  // Load the PDF file.
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  })

  const pdfDocument = await loadingTask.promise
  const parsedPath = path.parse(outputImagePath)
  const partialName = path.join(parsedPath.dir, parsedPath.name)
  const numPages = pdfDocument.numPages
  const padMaxLen = numPages.toString().length

  const canvasFactory = new NodeCanvasFactory()
  const canvasAndContext = canvasFactory.create(1, 1)
  for (let idx = 1; idx <= numPages; idx += 1) {
    const page = await pdfDocument.getPage(idx)
    const viewport = getPageViewPort(page, opts.scaleImage)
    canvasFactory.reset(canvasAndContext, viewport.width, viewport.height)
    await page.render({ canvasContext: canvasAndContext.context, viewport }).promise
    page.cleanup()
    const image = canvasAndContext.canvas.toBuffer('image/png')
    await new Promise<void>((res, rej) =>
      fs.writeFile(`${partialName}_${String(idx).padStart(padMaxLen, '0')}.png`, image, (err) =>
        err ? rej(err) : res(),
      ),
    )
  }
}
