import * as Jimp from 'jimp'

type ImgData = Readonly<{
  img: Jimp
  y: number
}>

/**
 * Merges an array of Jimp images into a single image.
 *
 * @param images - An array of Jimp images to be merged.
 * @returns A Jimp image that is the result of merging all input images.
 */
export function mergeImages(images: ReadonlyArray<Jimp>): Jimp {
  let imgHeight = 0
  const imgData: ImgData[] = images.map((img) => {
    const res = { img, y: imgHeight }
    imgHeight += img.bitmap.height
    return res
  })

  const imgWidth = Math.max(...imgData.map(({ img }) => img.bitmap.width))
  const baseImage = new Jimp(imgWidth, imgHeight, 0x00000000)

  imgData.forEach(({ img, y }) => baseImage.composite(img, 0, y))

  return baseImage
}
