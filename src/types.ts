/**
 * Options for converting a PDF to PNG format.
 */
export type Pdf2PngOpts = {
  /**
   * Indicates whether to upscale the image resolution from 72 DPI to 144 DPI.
   * Enabling this option results in a slower conversion process but produces a higher resolution image.
   *
   * @defaultValue true
   */
  scaleImage?: boolean
}
