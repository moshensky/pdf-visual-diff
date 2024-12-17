import { pathToPdf } from './utils.js'

test(
  'PDF visual regression',
  () => expect(pathToPdf).toMatchPdfSnapshot(),
  20_000,
)
