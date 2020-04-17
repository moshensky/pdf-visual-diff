# Visual Regression Testing for PDFs in JavaScript

[![NPM version][npm-badge-url]][npm-url]
[![code style: prettier][prettier-badge-url]][prettier-url]

## Install

```sh
npm install -D pdf-visual-diff
```

[npm-url]: https://www.npmjs.com/package/pdf-visual-diff
[npm-badge-url]: https://img.shields.io/npm/v/pdf-visual-diff.svg
[prettier-url]: https://github.com/prettier/prettier
[prettier-badge-url]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg

## Sample usage

```js
import { comparePdfToSnapshot } from 'pdf-visual-diff'
import { expect } from 'chai'

describe('test pdf report visual regression', () => {
  const pathToPdf = 'path to your pdf' // or you might pass in Buffer instead
  it('should pass', () =>
    comparePdfToSnapshot(pathToPdf, 'my-awesome-report').then((x) => expect(x).to.be.true))
})
```