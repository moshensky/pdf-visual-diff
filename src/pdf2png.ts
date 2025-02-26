import * as PImage from 'pureimage'
import { PImageBitmapFactory } from './pure-image-bitmap-factory'
import * as fs from 'fs'
import * as path from 'path'
import { PassThrough } from 'stream'
import { getDocument, type PDFPageProxy, type PageViewport } from 'pdfjs-dist/legacy/build/pdf.mjs'
import Jimp, { read } from 'jimp'
import { mergeImages } from './merge-images'

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

// pdfjs location
const PDFJS_DIR = path.dirname(require.resolve('pdfjs-dist'))

// Some PDFs need external cmaps.
const CMAP_URL = path.join(PDFJS_DIR, '../cmaps/')
const CMAP_PACKED = true

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL = path.join(PDFJS_DIR, '../standard_fonts/')

export type Pdf2PngOpts = Readonly<{
  // Slower, but better resolution
  scaleImage: boolean
}>

const pdf2PngDefOpts: Pdf2PngOpts = {
  scaleImage: true,
}

function getPageViewPort(page: PDFPageProxy, scaleImage: boolean): PageViewport {
  const viewport = page.getViewport({ scale: 1.0 })
  if (scaleImage === false) {
    return viewport
  }

  // Increase resolution
  const horizontalMm = convertFromPxToMm(viewport.width, 72)
  const verticalMm = convertFromPxToMm(viewport.height, 72)
  const actualWidth = convertFromMmToPx(horizontalMm, 144)
  const actualHeight = convertFromMmToPx(verticalMm, 144)
  const scale = Math.min(actualWidth / viewport.width, actualHeight / viewport.height)
  return page.getViewport({ scale })
}

export async function pdf2png(
  pdf: string | Buffer,
  options: Partial<Pdf2PngOpts> = {},
): Promise<ReadonlyArray<Jimp>> {
  const opts = {
    ...pdf2PngDefOpts,
    ...options,
  }

  // Load PDF
  const data = new Uint8Array(Buffer.isBuffer(pdf) ? pdf : fs.readFileSync(pdf))
  const loadingTask = getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    CanvasFactory: PImageBitmapFactory,
  })

  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  const bitmapFactory = new PImageBitmapFactory()

  // Generate images
  const images: Buffer[] = []

  for (let idx = 1; idx <= numPages; idx++) {
    const page = await pdfDocument.getPage(idx)
    const viewport = getPageViewPort(page, opts.scaleImage)

    // debugger

    const bitmapAndContext = bitmapFactory.create(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    )

    // TODO: fix types
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await page.render({ canvasContext: bitmapAndContext.context, viewport }).promise
    page.cleanup()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const image = []
    const passThroughStream = new PassThrough()
    passThroughStream.on('data', (chunk) => image.push(chunk))
    passThroughStream.on('end', () => {
      bitmapFactory.destroy(bitmapAndContext)
      // canvasAndContext.
    })

    PImage.encodePNGToStream(bitmapAndContext.canvas, passThroughStream)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    images.push(passThroughStream)

    // images.push(
    //   new Promise((resolve, reject) => {
    //     const passThroughStream = new PassThrough()
    //     passThroughStream.on('data', (chunk) => image.push(chunk))
    //     passThroughStream.on('end', resolve)
    //     PassThroughStream.on('error', reject)
    //     PImage.encodePNGToStream(canvasAndContext.canvas, passThroughStream)
    //     return passThroughStream
    //   }),
    // )
  }

  return Promise.all(images.map((x) => read(x)))
}

export const writeImages =
  (outputImagePath: string, combinePages = true) =>
  (images: ReadonlyArray<Jimp>): Promise<ReadonlyArray<Jimp>> => {
    if (combinePages === true) {
      return mergeImages(images)
        .writeAsync(outputImagePath)
        .then(() => images)
    }

    const parsedPath = path.parse(outputImagePath)
    const partialName = path.join(parsedPath.dir, parsedPath.name)
    const padMaxLen = images.length.toString().length
    return Promise.all(
      images.map((img, idx) =>
        img.writeAsync(`${partialName}_${String(idx + 1).padStart(padMaxLen, '0')}.png`),
      ),
    ).then(() => images)
  }
