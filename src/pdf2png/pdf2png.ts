import * as fs from 'fs'
import * as path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import Jimp, { read } from 'jimp'
import { PdfToPngOptions, Dpi } from '../types'
import { convertFromMmToPx, convertFromPxToMm } from '../conversions'
import { NodeCanvasFactory } from './nodeCanvasFactory'

// pdfjs location
const PDFJS_DIR = path.dirname(require.resolve('pdfjs-dist'))

// Some PDFs need external cmaps.
const CMAP_URL = path.join(PDFJS_DIR, '../cmaps/')
const CMAP_PACKED = true

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL = path.join(PDFJS_DIR, '../standard_fonts/')

const pdf2PngDefOpts: Required<PdfToPngOptions> = {
  dpi: Dpi.High,
}

const PDF_DPI = 72
function getPageViewPort(page: pdfjsLib.PDFPageProxy, dpi: Dpi | number): pdfjsLib.PageViewport {
  const dpiNum = dpi === Dpi.Low ? PDF_DPI : dpi === Dpi.High ? 144 : dpi
  const viewport = page.getViewport({ scale: 1.0 })
  if (dpiNum === PDF_DPI) {
    return viewport
  }

  // Increase resolution
  const horizontalMm = convertFromPxToMm(viewport.width, PDF_DPI)
  const verticalMm = convertFromPxToMm(viewport.height, PDF_DPI)
  const actualWidth = convertFromMmToPx(horizontalMm, dpiNum)
  const actualHeight = convertFromMmToPx(verticalMm, dpiNum)
  const scale = Math.min(actualWidth / viewport.width, actualHeight / viewport.height)
  return page.getViewport({ scale })
}

export async function pdf2png(
  pdf: string | Buffer,
  options: PdfToPngOptions = {},
): Promise<ReadonlyArray<Jimp>> {
  const opts = {
    ...pdf2PngDefOpts,
    ...options,
  }

  // Load PDF
  const data = new Uint8Array(Buffer.isBuffer(pdf) ? pdf : fs.readFileSync(pdf))
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  })

  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  const canvasFactory = new NodeCanvasFactory()
  const canvasAndContext = canvasFactory.create(1, 1)

  // Generate images
  const images: Buffer[] = []
  for (let idx = 1; idx <= numPages; idx += 1) {
    const page = await pdfDocument.getPage(idx)
    const viewport = getPageViewPort(page, opts.dpi)
    canvasFactory.reset(canvasAndContext, viewport.width, viewport.height)
    // TODO: fix types
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await page.render({ canvasContext: canvasAndContext.context, viewport }).promise
    page.cleanup()
    const image = canvasAndContext.canvas.toBuffer('image/png')
    images.push(image)
  }

  return Promise.all(images.map((x) => read(x)))
}
