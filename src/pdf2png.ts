import * as PImage from 'pureimage'
import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import { PassThrough } from 'stream'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
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

type canvasAndContext = {
  canvas: PImage.Bitmap
  context: PImage.Context & { canvas: PImage.Bitmap } & Pick<
      CanvasRenderingContext2D,
      'getLineDash' | 'setLineDash'
    >
}

class PImageBitmapFactory {
  create(width: number, height: number): canvasAndContext {
    assert.ok(width > 0 && height > 0, 'Invalid canvas size')

    const canvas = new Proxy(PImage.make(width, height), {
      get(target, prop, receiver) {
        if (prop === 'getContext') {
          const handle = target[prop]

          return function (this: PImage.Bitmap, ...args: Parameters<PImage.Bitmap['getContext']>) {
            const _context = handle.apply(this === receiver ? target : this, args)

            let _lineDash: ReturnType<canvasAndContext['context']['getLineDash']>

            //TODO: include createImageData https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createImageData
            Object.defineProperties(_context, {
              /**
               * provide bitmap instance as canvas to fufill pdf.js expectation for canvas factory
               */
              canvas: { value: target },
              /**
               * provide implementation for {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getLineDash | getLineDash} to fufill pdf.js expectation
               */
              getLineDash: {
                value: () => {
                  return _lineDash
                },
                enumerable: true,
                configurable: true,
              },
              /**
               *  provide implementation for {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash | setLineDash} to fufill pdf.js expectation
               */
              setLineDash: {
                value: (
                  ...args: Parameters<canvasAndContext['context']['setLineDash']>
                ): ReturnType<canvasAndContext['context']['setLineDash']> => {
                  _lineDash =
                    args[0].length % 2 === 1 ? ([] as number[]).concat(args[0], args[0]) : args[0]
                },
                enumerable: true,
                configurable: true,
              },
            })

            return new Proxy(_context, {
              get(_target, _prop: keyof canvasAndContext['context'], _receiver) {
                const value = Reflect.get(_target, _prop, _receiver)

                if (value instanceof Function) {
                  // augment pure image methods
                  switch (_prop) {
                    case 'moveTo': {
                      return (...args: Parameters<PImage.Context['moveTo']>) => {
                        if (!_target?.path) _target.beginPath.apply(_target)
                        return (value as PImage.Context['moveTo']).apply(_target, args)
                      }
                    }
                    default: {
                      return value.bind(_target)
                    }
                  }
                }

                return value
              },
            })
          }
        } else {
          return target[prop as keyof PImage.Bitmap]
        }
      },
    })

    return {
      canvas,
      context: canvas.getContext('2d') as canvasAndContext['context'],
    }
  }

  reset(canvasAndContext: canvasAndContext, width: number, height: number): void {
    assert.ok(canvasAndContext.canvas, 'Canvas is not specified')
    assert.ok(width > 0 && height > 0, 'Invalid canvas size')

    canvasAndContext = {
      ...this.create(width, height),
    }

    return

    // const pipe = new PassThrough()
    // await PImage.encodePNGToStream(canvasAndContext.canvas, pipe)

    // const PImage.decodePNGFromStream(pipe)

    // if (canvasAndContext) {
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   canvasAndContext.context = canvasAndContext.canvas.getContext('2d')
    // }
  }

  destroy(canvasAndContext: canvasAndContext): void {
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

function getPageViewPort(page: pdfjsLib.PDFPageProxy, scaleImage: boolean): pdfjsLib.PageViewport {
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
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    canvasFactory: new PImageBitmapFactory(),
  })

  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  const bitmapFactory = new PImageBitmapFactory()

  // Generate images
  const images: Buffer[] = []

  for (let idx = 1; idx <= numPages; idx++) {
    const page = await pdfDocument.getPage(idx)
    const viewport = getPageViewPort(page, opts.scaleImage)

    const bitmapAndContext = bitmapFactory.create(viewport.width, viewport.height)

    debugger
    // TODO: fix types
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await page.render({ canvasContext: bitmapAndContext.context, viewport }).promise
    page.cleanup()

    console.log('I got here!!:: \n')

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
