import { pathToPdf } from './utils.js'

test(
  'PDF visual regression',
  () => expect(pathToPdf).toMatchPdfSnapshot({ pdf2PngOptions: { dpi: 72 } }),
  20_000,
)
