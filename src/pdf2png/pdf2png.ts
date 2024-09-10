import * as fs from 'fs'
import * as path from 'path'
import * as Jimp from 'jimp'
import { PdfToPngOptions, Dpi } from '../types'
import { convertFromMmToPx, convertFromPxToMm } from '../conversions'
import { NodeCanvasFactory } from './nodeCanvasFactory'
import type { PDFPageProxy, PageViewport } from 'pdfjs-dist'
import { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'

// pdfjs location
const PDFJS_DIR = path.dirname(require.resolve('pdfjs-dist'))

const DOCUMENT_INIT_PARAMS_DEFAULTS: DocumentInitParameters = {
  // Where the standard fonts are located.
  standardFontDataUrl: path.join(PDFJS_DIR, '../standard_fonts/'),
  // Some PDFs need external cmaps.
  cMapUrl: path.join(PDFJS_DIR, '../cmaps/'),
  cMapPacked: true,
}

const pdf2PngDefOpts: Required<PdfToPngOptions> = {
  dpi: Dpi.High,
}

const PDF_DPI = 72
function getPageViewPort(page: PDFPageProxy, dpi: Dpi | number): PageViewport {
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
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const opts = {
    ...pdf2PngDefOpts,
    ...options,
  }

  // Load PDF
  const data = new Uint8Array(Buffer.isBuffer(pdf) ? pdf : fs.readFileSync(pdf))
  const loadingTask = getDocument({
    data,
    ...DOCUMENT_INIT_PARAMS_DEFAULTS,
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

  return Promise.all(images.map((x) => Jimp.read(x)))
}
