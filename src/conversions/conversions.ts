/**
 * Converts a size from millimeters to pixels based on the provided DPI (dots per inch).
 *
 * @param sizeMm - The size in millimeters.
 * @param dpi - The dots per inch (DPI) for the conversion.
 * @returns The size in pixels.
 */
export function convertFromMmToPx(sizeMm: number, dpi: number): number {
  if (sizeMm <= 0 || dpi <= 0) {
    return 0
  }
  const sizeInch = sizeMm / 25.4
  return Math.round(sizeInch * dpi)
}

/**
 * Converts a size from pixels to millimeters based on the provided DPI (dots per inch).
 *
 * @param sizePx - The size in pixels.
 * @param dpi - The dots per inch (DPI) for the conversion.
 * @returns The size in millimeters.
 */
export function convertFromPxToMm(sizePx: number, dpi: number): number {
  if (sizePx <= 0 || dpi <= 0) {
    return 0
  }
  const sizeInch = sizePx / dpi
  return Math.round(sizeInch * 25.4)
}
