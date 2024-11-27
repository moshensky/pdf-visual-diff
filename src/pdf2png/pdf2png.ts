import * as Canvas from 'canvas'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { Jimp, JimpInstance } from 'jimp'
import type { PDFDocumentProxy, PDFPageProxy, PageViewport } from 'pdfjs-dist'
import { DocumentInitParameters, RenderParameters } from 'pdfjs-dist/types/src/display/api'
import { PdfToPngOptions, Dpi } from '../types'
import { convertFromMmToPx, convertFromPxToMm } from '../conversions'

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

function mkPdfPagesRenderer(pdfDocument: PDFDocumentProxy, dpi: Dpi | number) {
  return async function <T>(
    toImage: (canvas: Canvas.Canvas) => T,
    toJimpInstances: (images: Array<T>) => Promise<ReadonlyArray<JimpInstance>>,
  ): Promise<ReadonlyArray<JimpInstance>> {
    const images: Array<T> = []
    const totalPages = pdfDocument.numPages

    for (let idx = 1; idx <= totalPages; idx += 1) {
      const page = await pdfDocument.getPage(idx)
      const canvasFactory = pdfDocument.canvasFactory
      const viewport = getPageViewPort(page, dpi)
      // @ts-expect-error
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)
      const renderParameters: RenderParameters = {
        canvasContext: canvasAndContext.context,
        viewport,
      }
      await page.render(renderParameters).promise
      images.push(toImage(canvasAndContext.canvas))
      page.cleanup()
    }

    return toJimpInstances(images)
  }
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
  const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : await fs.readFile(pdf)
  const loadingTask = getDocument({
    ...DOCUMENT_INIT_PARAMS_DEFAULTS,
    data: new Uint8Array(pdfBuffer),
  })

  const pdfDocument = await loadingTask.promise
  const renderPdfPages = mkPdfPagesRenderer(pdfDocument, opts.dpi)

  /**
   * For faster processing, we want to use `Jimp.fromBitmap`. However, it
   * internally uses `instanceof`, which doesn't work well with Jest due to
   * [Jest globals differing from Node globals](https://github.com/jestjs/jest/issues/2549).
   */
  // @ts-expect-error we have to assert if running in jest env
  if (typeof jest !== 'undefined') {
    return renderPdfPages(
      (canvas) => canvas.toBuffer('image/png'),
      (images) => Promise.all(images.map((x) => Jimp.read(x).then((x) => x as JimpInstance))),
    )
  } else {
    return renderPdfPages(
      (canvas) => Jimp.fromBitmap(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)) as JimpInstance,
      (images) => Promise.resolve(images),
    )
  }
}
