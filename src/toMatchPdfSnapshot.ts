import { dirname } from 'path'
import { comparePdfToSnapshot, CompareOptions } from './compare-pdf-to-snapshot'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toMatchPdfSnapshot(options?: CompareOptions): R
    }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const jestExpect = global.expect

if (jestExpect !== undefined) {
  jestExpect.extend({
    // TODO: use jest snapshot functionality
    toMatchPdfSnapshot(pdf: string | Buffer, options?: CompareOptions) {
      const { isNot, testPath, currentTestName } = this
      if (isNot) {
        throw new Error('Jest: `.not` cannot be used with `.toMatchPdfSnapshot()`.')
      }

      const currentDirectory = dirname(testPath)
      const snapshotName = currentTestName.split(' ').join('_')

      return comparePdfToSnapshot(pdf, currentDirectory, snapshotName, options).then((pass) => ({
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
