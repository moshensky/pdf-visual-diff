import { dirname } from 'path'
import { comparePdfToSnapshot } from './compare-pdf-to-snapshot'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      toMatchPdfSnapshot(): R
    }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const jestExpect = global.expect

if (jestExpect !== undefined) {
  jestExpect.extend({
    // TODO: use jest snapshot functionality
    toMatchPdfSnapshot(pdf: string | Buffer) {
      const { isNot, testPath, currentTestName } = this
      if (isNot) {
        throw new Error('Jest: `.not` cannot be used with `.toMatchPdfSnapshot()`.')
      }

      const currentDirectory = dirname(testPath)
      const snapshotName = currentTestName.split(' ').join('_')

      return comparePdfToSnapshot(pdf, currentDirectory, snapshotName).then((pass) => ({
        pass,
        message: () => 'Does not match with snapshot.',
      }))
    },
  })
} else {
  console.error(
    "Unable to find Jest's global expect." +
      '\nPlease check you have added toMatchPdfSnapshot correctly to your jest configuration.',
  )
}
