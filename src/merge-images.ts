import Jimp, { read } from 'jimp'

type ImgData = Readonly<{
  img: Jimp
  y: number
}>

export const mergeImages = async (images: ReadonlyArray<Buffer>): Promise<Jimp> => {
  const imgs: ReadonlyArray<Jimp> = await Promise.all(images.map((x) => read(x)))
  let imgHeight = 0
  const imgData: ImgData[] = imgs.map((img) => {
    const res = { img, y: imgHeight }
    imgHeight += img.bitmap.height
    return res
  })

  const imgWidth = Math.max(...imgData.map(({ img }) => img.bitmap.width))
  const baseImage = new Jimp(imgWidth, imgHeight, 0x00000000)

  imgData.forEach(({ img, y }) => baseImage.composite(img, 0, y))

  return baseImage
}
