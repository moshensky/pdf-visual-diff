# Visual Regression Testing for PDFs in JavaScript

[![NPM version][npm-badge-url]][npm-url]
[![code style: prettier][prettier-badge-url]][prettier-url]
![Pull Request CI/CD](https://github.com/moshensky/pdf-visual-diff/workflows/Pull%20Request%20CI/CD/badge.svg?branch=master)

## Getting started

First download and install [GraphicsMagick](http://www.graphicsmagick.org/) for your platform. For macOS you can simply use [Homebrew](http://mxcl.github.io/homebrew/) and do:

```sh
brew install graphicsmagick
```

then use npm:

```sh
npm install -D pdf-visual-diff
```

[npm-url]: https://www.npmjs.com/package/pdf-visual-diff
[npm-badge-url]: https://img.shields.io/npm/v/pdf-visual-diff.svg
[prettier-url]: https://github.com/prettier/prettier
[prettier-badge-url]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg

## Description

This package exports single function `comparePdfToSnapshot`. With the following signature:

```ts
/**
 * Compare pdf to persisted snapshot. If one does not exist it is created
 * @param pdf - path to pdf file or pdf loaded as Buffer
 * @param snapshotDir - path to a directory where __snapshots__ folder is going to be created
 * @param snapshotName - uniq name of a snapshot in the above path
 */
type ComparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
) => Promise<boolean>
```

When function is executed it has following **side** effects:

- In absence of a previous snapshot file it converts pdf to an image, saves it as a snapshot and returns `true`
- If there is a snapshot, then pdf is converted to an image and gets compared to the snapshot:
  - if they differ function returns `false` and creates next to the snapshot image two other versions with suffixes `new` and `diff`. `new` one is the current view of the pdf as an image, where `diff` shows the difference between the snapshot and `new` images
  - if they are equal function returns `true` and in case there are `new` and `diff` versions persisted it deletes them

## Sample usage

Write a test file:

```js
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { expect } from 'chai'

describe('test pdf report visual regression', () => {
  const pathToPdf = 'path to your pdf' // or you might pass in Buffer instead
  it('should pass', () =>
    comparePdfToSnapshot(pathToPdf, __dirname, 'my-awesome-report').then((x) => expect(x).to.be.true))
})
```

## Usage with Jest  `expect.extend`

Create file with code along those lines:

```ts
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { dirname } from 'path'
import { makePdf } from './pdfmake'
import { TDocumentDefinitions } from 'pdfmake/interfaces'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toMatchPdfSnapshot(): R
    }
  }
}

expect.extend({
  // TODO: use jest snapshot api (for an easier snapshots update)
  toMatchPdfSnapshot(pdf: string | Buffer) {
    const { isNot, testPath, currentTestName } = this
    if (isNot) {
      throw new Error('Jest: `.not` cannot be used with `.toMatchPdfSnapshot()`.')
    }

    const currentDirectory = dirname(testPath)
    const snapshotName = currentTestName.split(' ').join('_')

    return comparePdfToSnapshot(pdf, currentDirectory, snapshotName)
      .then((pass) => ({
        pass,
        message: () => 'Does not match with snapshot.',
      }))
  },
})
```

NB! Do not forget to register above code in your jest.config `setupFilesAfterEnv`.

Then all you have to do in your tests is pass a path to the pdf or pdf content as Buffer. 

```ts
const pathToPdf = 'path to your pdf' // or you might pass in Buffer instead
describe('test pdf report visual regression', () => {
  it('should match', () => expect(pathToPdf).toMatchPdfSnapshot())
})
```

As you can seen no need to fiddle with any dirs nor names. Needed information is extracted from jest context.
