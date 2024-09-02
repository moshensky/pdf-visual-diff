# Test visual regression in PDFs

[![NPM version][npm-badge-url]][npm-url]
[![code style: prettier][prettier-badge-url]][prettier-url]
![Pull Request CI/CD](https://github.com/moshensky/pdf-visual-diff/workflows/Pull%20Request%20CI/CD/badge.svg?branch=master)

`pdf-visual-diff` is a library for testing visual regression in PDFs. It utilizes [pdf.js](https://github.com/mozilla/pdf.js) to convert PDFs into PNGs and [jimp](https://github.com/oliver-moran/jimp) for performing image comparisons.

## Installation

Please note that this library depends on canvas, so consult the [canvas](https://github.com/Automattic/node-canvas) documentation for any additional installation steps.

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
 * @param compareOptions - image comparison options
 * @param compareOptions.tolerance - number value for error tolerance, ranges 0-1 (default: 0)
 * @param compareOptions.maskRegions - `(page: number) => ReadonlyArray<RegionMask> | undefined` mask predefined regions per page, i.e. when there are parts of the pdf that change between tests
 */
type ComparePdfToSnapshot = (
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  compareImageOpts: Partial<CompareOptions> = {},
) => Promise<boolean>
```

When function is executed it has following **side** effects:

- In absence of a previous snapshot file it converts pdf to an image, saves it as a snapshot and returns `true`
- If there is a snapshot, then pdf is converted to an image and gets compared to the snapshot:
  - if they differ function returns `false` and creates next to the snapshot image two other versions with suffixes `new` and `diff`. `new` one is the current view of the pdf as an image, where `diff` shows the difference between the snapshot and `new` images
  - if they are equal function returns `true` and in case there are `new` and `diff` versions persisted it deletes them

## Sample usage

> **NB!** You can find sample projects inside  [examples](https://github.com/moshensky/pdf-visual-diff/tree/master/examples) folder.

Write a test file:

```js
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { expect } from 'chai'

describe('test pdf report visual regression', () => {
  const pathToPdf = 'path to your pdf' // or you might pass in Buffer instead
  it('should pass', () =>
    comparePdfToSnapshot(pathToPdf, __dirname, 'my-awesome-report').then(
      (x) => expect(x).to.be.true,
    ))
})

// Example with masking regions of a two page pdf
describe('pdf masking', () => {
  it('should mask two page pdf', () => {
    const blueMask: RegionMask = {
      type: 'rectangle-mask',
      x: 50,
      y: 75,
      width: 140,
      height: 100,
      color: 'Blue',
    }
    const greenMask: RegionMask = {
      type: 'rectangle-mask',
      x: 110,
      y: 200,
      width: 90,
      height: 50,
      color: 'Green',
    }

    comparePdfToSnapshot(twoPagePdfPath, __dirname, 'different-mask-per-page', {
      maskRegions: (page) => {
        switch (page) {
          case 1:
            return [blueMask]
          case 2:
            return [greenMask]
          default:
            return []
        }
      },
    }).then((x) => expect(x).to.be.true))
  })
})

```

## Tools

`pdf-visual-diff` provides scripts for approving or discarding new PDF snapshots. To use these scripts, add them to the `scripts` section of your `package.json`:

```json
"scripts": {
  "test:pdf-approve": "pdf-visual-diff approve",
  "test:pdf-discard": "pdf-visual-diff discard"
}
```

To approve new snapshots, run the following command in your terminal:

```sh
npm run test:pdf-approve
```

New snapshots paths will be listed. You will then be prompted to confirm whether you want to replace the old snapshots with the new ones:

```sh
New snapshots:
./__snapshots__/test_doc_1.new.png
./__snapshots__/single-page-snapshot.new.png
Are you sure you want to overwrite current snapshots? [Y/n]:
```

These commands can be customized by specifying a custom path and snapshots folder name.

```sh
pdf-visual-diff approve

Approve new snapshots

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -p, --path                                                      [default: "."]
  -s, --snapshots-dir-name                            [default: "__snapshots__"]
```

```sh
pdf-visual-diff discard

Discard new snapshots and diffs

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -p, --path                                                      [default: "."]
  -s, --snapshots-dir-name                            [default: "__snapshots__"]
```

## Usage with Jest

This packages provides custom jest matcher `toMatchPdfSnapshot`

### Setup

```json
"jest": {
  "setupFilesAfterEnv": ["pdf-visual-diff/lib/toMatchPdfSnapshot"]
}
```

If you are using **Typescript** add `import('pdf-visual-diff/lib/toMatchPdfSnapshot')` to your typings.

### Usage

All you have to do in your tests is pass a path to the pdf or pdf content as Buffer.

```ts
const pathToPdf = 'path to your pdf' // or you might pass in Buffer instead
describe('test pdf report visual regression', () => {
  it('should match', () => expect(pathToPdf).toMatchPdfSnapshot())
})
```

As you can see no need to fiddle with any dirs nor names. Needed information is extracted from jest context.
