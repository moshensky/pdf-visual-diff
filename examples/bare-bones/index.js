const { comparePdfToSnapshot } = require('pdf-visual-diff')
const { join } = require('path')

const pathToPdf = join(__dirname, 'single-page.pdf')
const snapshotDir = join(__dirname)
const snapshotName = 'single-page-snapshot'

comparePdfToSnapshot(pathToPdf, snapshotDir, snapshotName).then(isEqual => {
  console.log(`Is pdf equal to it's snapshot? Answer: ${isEqual}`)
}).catch(console.error)