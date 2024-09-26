# Test Visual Regression in PDFs

[![NPM version][npm-badge-url]][npm-url]
[![code style: prettier][prettier-badge-url]][prettier-url]
![Pull Request CI/CD](https://github.com/moshensky/pdf-visual-diff/workflows/Pull%20Request%20CI/CD/badge.svg?branch=master)

`pdf-visual-diff` is a library for testing visual regressions in PDFs. It uses [pdf.js](https://github.com/mozilla/pdf.js) to convert PDFs into PNGs and [jimp](https://github.com/oliver-moran/jimp) for image comparisons.

> [API Documentation](https://moshensky.github.io/pdf-visual-diff)

## Installation

This library depends on `canvas` package. Please refer to the [canvas documentation](https://github.com/Automattic/node-canvas) for any additional installation steps.

```sh
npm install -D pdf-visual-diff
```

[npm-url]: https://www.npmjs.com/package/pdf-visual-diff
[npm-badge-url]: https://img.shields.io/npm/v/pdf-visual-diff.svg
[prettier-url]: https://github.com/prettier/prettier
[prettier-badge-url]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg

## Description

This package exports [comparePdfToSnapshot](https://moshensky.github.io/pdf-visual-diff/functions/comparePdfToSnapshot.html) function, with the following signature:

```ts
function comparePdfToSnapshot(
  pdf: string | Buffer,
  snapshotDir: string,
  snapshotName: string,
  options?: CompareOptions
): Promise<boolean>
```

Compares a PDF to a persisted snapshot, with behavior for handling missing snapshots controlled by the `failOnMissingSnapshot` option.

The function has the following **side effects**:

- If no snapshot exists:
  - If `failOnMissingSnapshot` is `false` (default), the PDF is converted to an image, saved as a new snapshot, and the function returns `true`.
  - If `failOnMissingSnapshot` is `true`, the function returns `false` without creating a new snapshot.
- If a snapshot exists, the PDF is converted to an image and compared to the snapshot:
  - If they differ, the function returns `false` and creates two additional images next to the snapshot: one with the suffix `new` (the current view of the PDF as an image) and one with the suffix `diff` (showing the difference between the snapshot and the `new` image).
  - If they are equal, the function returns `true`. If `new` and `diff` versions are present, they are deleted.

Returns a promise that resolves to `true` if the PDF matches the snapshot or if the behavior for a missing snapshot is configured to allow it. Returns `false` if the PDF differs from the snapshot or if `failOnMissingSnapshot` is `true` and the snapshot is missing.

For further details and [configuration options](https://moshensky.github.io/pdf-visual-diff/types/CompareOptions.html), please refer to the [API Documentation](https://moshensky.github.io/pdf-visual-diff).

## Sample usage

> **Note:** You can find sample projects in the [examples](https://github.com/moshensky/pdf-visual-diff/tree/master/examples) folder.

Write a test file:

```js
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { expect } from 'chai'

describe('test PDF report visual regression', () => {
  const pathToPdf = 'path to your PDF' // or you might pass a Buffer instead
  it('should pass', () =>
    comparePdfToSnapshot(pathToPdf, __dirname, 'my-awesome-report').then(
      (x) => expect(x).to.be.true,
    ))
})

// Example with masking regions of a two-page PDF
describe('PDF masking', () => {
  it('should mask two-page PDF', () => {
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

`pdf-visual-diff` provides a CLI for approving or discarding new PDF snapshots. The CLI can be used via `npx` or `npm` by updating the `scripts` section of your `package.json`:

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

Paths for the new snapshots will be listed. You will then be prompted to confirm whether you want to replace the old snapshots with the new ones:

```sh
New snapshots:
./__snapshots__/test_doc_1.new.png
./__snapshots__/single-page-snapshot.new.png
Are you sure you want to overwrite current snapshots? [Y/n]:
```

These commands can be customized by specifying a custom path and snapshots folder name.

Approve command help:

```sh
npx pdf-visual-diff approve --help

Approve new snapshots

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -p, --path                                                      [default: "."]
  -s, --snapshots-dir-name                            [default: "__snapshots__"]
```

Discard command help:

```sh
npx pdf-visual-diff discard --help

Discard new snapshots and diffs

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -p, --path                                                      [default: "."]
  -s, --snapshots-dir-name                            [default: "__snapshots__"]
```

## Usage with Jest

This packages provides a custom Jest matcher `toMatchPdfSnapshot`.

### Setup

```json
"jest": {
  "setupFilesAfterEnv": ["pdf-visual-diff/lib/toMatchPdfSnapshot"]
}
```

If you are using **TypeScript** add `import('pdf-visual-diff/lib/toMatchPdfSnapshot')` to your typings.

### Usage

In your tests, pass a path to the PDF or PDF content a Buffer.

```ts
const pathToPdf = 'path to your PDF' // or you might pass a Buffer instead
describe('test PDF report visual regression', () => {
  it('should match', () => expect(pathToPdf).toMatchPdfSnapshot())
})
```

As you can see, there is no need to manage directories or names manually. The necessary information is extracted from the Jest context.
