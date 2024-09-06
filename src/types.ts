/**
 * Enum representing predefined DPI (Dots Per Inch) values.
 */
export enum Dpi {
  Low = 72,
  High = 144,
}

/**
 * Configuration options for converting a PDF to PNG format.
 */
export type PdfToPngOptions = {
  /**
   * The DPI value used to calculate image resolution.
   *
   * @remarks
   * - Use `Dpi.Low` for the default PDF viewport size at 72 DPI. This option generates an image with lower resolution, resulting in lesser quality but faster processing time. At this setting, one PDF point corresponds to one pixel.
   * - Use `Dpi.High` for twice the default PDF viewport size at 144 DPI. This option provides better image quality at the cost of longer processing time. At this setting, one PDF point corresponds to two pixels.
   * - You can also provide a custom DPI value as a number.
   *
   * @defaultValue Dpi.High
   */
  dpi?: Dpi | number
}
