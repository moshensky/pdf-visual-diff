import * as fs from 'fs/promises'
import * as path from 'path'
import { Jimp, JimpInstance } from 'jimp'
import { PdfToPngOptions, Dpi } from '../types'
import { convertFromMmToPx, convertFromPxToMm } from '../conversions'
import { mkCanvas } from './nodeCanvasFactory'
import type { PDFPageProxy, PageViewport } from 'pdfjs-dist'
import { DocumentInitParameters, RenderParameters } from 'pdfjs-dist/types/src/display/api'

// pdfjs location
const PDFJS_DIR = path.join(path.dirname(require.resolve('pdfjs-dist')), '..')

const DOCUMENT_INIT_PARAMS_DEFAULTS: DocumentInitParameters = {
  // Where the standard fonts are located.
  standardFontDataUrl: path.join(PDFJS_DIR, 'standard_fonts/'),
  // Some PDFs need external cmaps.
  cMapUrl: path.join(PDFJS_DIR, 'cmaps/'),
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
): Promise<ReadonlyArray<JimpInstance>> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const opts = {
    ...pdf2PngDefOpts,
    ...options,
  }

  // Load PDF
  const pdfBuffer = await (Buffer.isBuffer(pdf) ? Promise.resolve(pdf) : fs.readFile(pdf))
  const loadingTask = getDocument({
    ...DOCUMENT_INIT_PARAMS_DEFAULTS,
    data: new Uint8Array(pdfBuffer),
  })

  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  const canvas = mkCanvas()

  // Generate images
  const images: JimpInstance[] = []
  for (let idx = 1; idx <= numPages; idx += 1) {
    const page = await pdfDocument.getPage(idx)
    const viewport = getPageViewPort(page, opts.dpi)
    canvas.set(viewport.width, viewport.height)
    const renderParameters: RenderParameters = {
      // @ts-expect-error type mismatch between web and node.js canvas
      canvasContext: canvas.context,
      viewport,
    }
    await page.render(renderParameters).promise
    page.cleanup()
    const imgData = canvas.context.getImageData(0, 0, viewport.width, viewport.height)
    images.push(Jimp.fromBitmap(imgData) as JimpInstance)
  }

  canvas.destroy()

  return images
}
