import * as assert from 'assert'
import * as PImage from 'pureimage'
import { DOMMatrix } from 'geometry-interfaces'

type CanvasAndContext = {
  canvas: PImage.Bitmap
  context: PImage.Context & { canvas: PImage.Bitmap } & Pick<
      CanvasRenderingContext2D,
      'getLineDash' | 'setLineDash' | 'createImageData'
    >
}

const augmentedPIBackedCanvas = (width: number, height: number) => {
  return new Proxy(PImage.make(width, height), {
    get(target, prop, receiver) {
      switch (prop) {
        case 'getContext': {
          const handle = target[prop]

          return function (this: PImage.Bitmap, ...args: Parameters<PImage.Bitmap['getContext']>) {
            const _context = handle.apply(this === receiver ? target : this, args)

            let _lineDash: ReturnType<CanvasAndContext['context']['getLineDash']>

            // Define methods missing on pure image's canvas 2d context implementation
            Object.defineProperties(_context, {
              /**
               * provide bitmap instance as canvas to fulfill pdf.js expectation for canvas factory
               */
              canvas: { value: target },
              /**
               * provide implementation for {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getLineDash | getLineDash} to fulfill complete canvas 2d context api
               */
              getLineDash: {
                value: () => _lineDash,
                enumerable: true,
                configurable: true,
              },
              /**
               * provide implementation for {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash | setLineDash} to fulfill complete canvas 2d context api
               */
              setLineDash: {
                value: (
                  ...args: Parameters<CanvasRenderingContext2D['setLineDash']>
                ): ReturnType<CanvasRenderingContext2D['setLineDash']> => {
                  _lineDash =
                    args[0].length % 2 === 1 ? ([] as number[]).concat(args[0], args[0]) : args[0]
                },
                enumerable: true,
                configurable: true,
              },
              /**
               * provide implementation for {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createImageData | createImageData} to fulfill complete canvas 2d context api
               */
              createImageData: {
                value: (
                  ...args: Parameters<CanvasRenderingContext2D['createImageData']>
                ): PImage.Bitmap => {
                  if (args.length === 1 && args[0] instanceof ImageData) {
                    _context.putImageData.call(_context, args[0].data, 0, 0)
                  }

                  return _context.getImageData.apply(_context, [
                    0,
                    0,
                    args[0].width,
                    args[0].height,
                  ])
                },
                enumerable: true,
                configurable: true,
              },
            })

            // enrich existing context methods from pure image
            return new Proxy(_context, {
              get(_target, _prop: keyof CanvasAndContext['context'], _receiver) {
                const value = Reflect.get(_target, _prop, _receiver)

                if (value instanceof Function) {
                  switch (_prop) {
                    // case 'moveTo': {
                    //   return (...args: Parameters<PImage.Context['moveTo']>) => {
                    //     if (!_target?.path) _target.beginPath.apply(_target)
                    //     return (value as PImage.Context['moveTo']).apply(_target, args)
                    //   }
                    // }
                    case 'getTransform': {
                      // return a dom matrix instance within the canvas 2d context that exposes the apis that match the dom matrix api
                      return (): ReturnType<CanvasRenderingContext2D['getTransform']> => {
                        const pureImageDomMatrix = _target.getTransform.apply(_target)
                        const domMatrix = new DOMMatrix([
                          pureImageDomMatrix.a,
                          pureImageDomMatrix.b,
                          pureImageDomMatrix.c,
                          pureImageDomMatrix.d,
                          pureImageDomMatrix.e,
                          0,
                        ])

                        Object.defineProperties(domMatrix, {
                          // invertSelf definition informed from https://github.com/vbravest/transform-tracker/blob/master/transform-tracker.js#L151
                          invertSelf: {
                            value: (): ReturnType<DOMMatrix['invertSelf']> => {
                              const det =
                                1 / (domMatrix.a * domMatrix.d - domMatrix.b * domMatrix.c)

                              const m0 = domMatrix.d / det
                              const m1 = -domMatrix.b / det
                              const m2 = -domMatrix.c / det
                              const m3 = domMatrix.a / det
                              const m4 =
                                det * (domMatrix.c * domMatrix.f - domMatrix.d * domMatrix.e)
                              const m5 =
                                det * (domMatrix.b * domMatrix.e - domMatrix.a * domMatrix.f)

                              // for our use case it's okay to simple return the new matrix that doesn't implement invertSelf
                              return new DOMMatrix([m0, m1, m2, m3, m4, m5])
                            },
                            enumerable: true,
                            configurable: false,
                          },
                        })

                        return domMatrix
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
        }
        default: {
          return target[prop as keyof PImage.Bitmap]
        }
      }
    },
  })
}

export class PImageBitmapFactory {
  create(width: number, height: number): CanvasAndContext {
    assert.ok(width > 0 && height > 0, 'Invalid canvas size')

    const canvas = augmentedPIBackedCanvas(width, height)

    return {
      canvas,
      context: canvas.getContext('2d') as CanvasAndContext['context'],
    }
  }

  reset(canvasAndContext: CanvasAndContext, width: number, height: number): void {
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
