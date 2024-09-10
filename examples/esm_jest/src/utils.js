import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pdfDir = join(__dirname, '..', 'pdf')

export const pathToPdf = join(pdfDir, 'test_doc_1.pdf')
export const pathToChangedPdf = join(pdfDir, 'test_doc_1_changed.pdf')
