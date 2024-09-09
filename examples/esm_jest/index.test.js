// import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pathToPdf = join(__dirname, 'pdf', 'test_doc_1.pdf')
// const pathToPdf = join(__dirname, 'pdf', 'test_doc_1_changed.pdf')

test('PDF visual regression', () => {
  return expect(pathToPdf).toMatchPdfSnapshot({ pdf2PngOptions: { dpi: 72 } })
}, 20_000)
