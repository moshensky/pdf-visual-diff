# Changelog

## 0.15.0 / Unreleased

- [PR#90](https://github.com/moshensky/pdf-visual-diff/pull/90) chore: update
`pdfjs-dist` to `v4.10.38`. This is considered a **BREAKING CHANGE**
due to potential minor changes to generated snapshots.

## 0.14.0 / 2024-12-06

### :tada: Enhancements

- [PR#85](https://github.com/moshensky/pdf-visual-diff/pull/85) chore: update `pdfjs-dist` to latest `v4.9.155`. This is a **BREAKING CHANGE**:
  - The minimum supported Node.js version is now v20.18.1.
  - `pdfjs-dist` introduces a major change in how PDFs are rasterized by replacing `node/canvas` with `@napi-rs/canvas`. This is a positive improvement because the latter has zero dependecines. However, you should expect to update all your existing snapshots.

## 0.13.0 / 2024-11-27

### 🐛 Bug Fix

- [PR#82](https://github.com/moshensky/pdf-visual-diff/pull/82) fix: error due to pdfjs-dist update and fix new vulnerabilities by updating dependecies
  [pdfjs-dist v4.7.76](https://github.com/mozilla/pdf.js/releases/tag/v4.7.76) introduced changes to CanvasFactory that fail with:

  TypeError: Image or Canvas expected

  ```sh
      at drawImageAtIntegerCoords (node_modules/pdfjs-dist/legacy/build/webpack:/pdf.js/src/display/canvas.js:261:9)
      at CanvasGraphics.paintInlineImageXObject (node_modules/pdfjs-dist/legacy/build/webpack:/pdf.js/src/display/canvas.js:2990:5)
      at CanvasGraphics.apply (node_modules/pdfjs-dist/legacy/build/webpack:/pdf.js/src/display/canvas.js:2879:10)
      at CanvasGraphics.executeOperatorList (node_modules/pdfjs-dist/legacy/build/webpack:/pdf.js/src/display/canvas.js:967:20)
      at InternalRenderTask._next (node_modules/pdfjs-dist/legacy/build/webpack:/pdf.js/src/display/api.js:3486:37)
  ```

- [PR#76](https://github.com/moshensky/pdf-visual-diff/pull/76) fix: remove new snapshot when existing snapshot matches

## 0.12.0 / 2024-09-26

### :tada: Enhancements

- [PR#70](https://github.com/moshensky/pdf-visual-diff/pull/70): feat: add failOnMissingSnapshot to `comparePdfToSnapshot` options. If no snapshot exists:
  - If `failOnMissingSnapshot` is `false` (default), the PDF is converted to an image,
      saved as a new snapshot, and the function returns `true`.
  - If `failOnMissingSnapshot` is `true`, the function returns `false` without creating a new snapshot.

## 0.11.1 / 2024-09-11

- [PR#68](https://github.com/moshensky/pdf-visual-diff/pull/68): Fix when running in jest context.

## 0.11.0 / 2024-09-11

- [PR#67](https://github.com/moshensky/pdf-visual-diff/pull/67): Dependencies update. **BREAKING CHANGE**: Minimum supported **Node.js v18**.
  Notably, the update of `pdfjs-dist` to **v4** (`^4.6.82`) from v3 introduces significant changes. As a result, this release is a **BREAKING CHANGE**:
  - Due to the update in `pdfjs-dist`, the minimum supported Node.js version is now 18.
  - If you were using a version of `pdfjs-dist` lower than [v3.7.107](https://github.com/mozilla/pdf.js/releases/tag/v3.7.107), your snapshots might start to fail due to changes in how fonts are loaded and used in certain circumstances.

  For the time being, this release has 0 vulnerabilities according to `npm audit`.

## 0.10.0 / 2024-09-06

- [#58](https://github.com/moshensky/pdf-visual-diff/issues/58): Expose option to set rendering DPI.
- [PR#65](https://github.com/moshensky/pdf-visual-diff/pull/65): Add [API documentation](https://moshensky.github.io/pdf-visual-diff/).

## 0.9.0 / 2023-09-04

- [PR#54](https://github.com/moshensky/pdf-visual-diff/pull/54): Export MaskRegions type.

## 0.8.0 / 2023-04-22

- [PR#52](https://github.com/moshensky/pdf-visual-diff/pull/52): Dependencies update. **BREAKING CHANGE** minimum supported **node v16**.

### :tada: Enhancements

- [#51](https://github.com/moshensky/pdf-visual-diff/issues/51): Enable mask regions for multi page pdfs. It is possible to have different mask regions per each page. This is an api **BREAKING CHANGE**.

If you haven't used `maskRegions` then you don't have to change anything.
`maskRegions` is changed from `ReadonlyArray<RegionMask>` to `(page: number) => ReadonlyArray<RegionMask>`. Straight forward code update could be:

```ts
// Change options from:
const opts = {
  maskRegions: [
    // Your mask definitions...
  ]
}

// To
const opts = {
  // Here one can use `page` parameter to provide different mask regions for every page
  maskRegions: (page) => [
    // Your mask definitions...
  ]
}

const opts = {
  maskRegions: () => [blueMask, greenMask]
}

comparePdfToSnapshot( singlePagePdfPath, __dirname, 'mask-rectangle-masks', opts)
```

## 0.7.1 / 2023-02-23

### 🐛 Bug Fix

- [#50](https://github.com/moshensky/pdf-visual-diff/pull/50): Fixed pdfjs cmaps path resolution

## 0.7.0 / 2023-01-18

- **BREAKING CHANGE** due to dependencies update. Minimum supported node 14. Some image diffs might occur as well.
- [#48](https://github.com/moshensky/pdf-visual-diff/issues/48): Crash on Nodejs18

## 0.6.0 / 2022-05-16

### 🐛 Bug Fix

- [#40](https://github.com/moshensky/pdf-visual-diff/pull/40): masked areas not in initial file

### :tada: Enhancements

- Graphicsmagick is not needed any more, but this is a **BREAKING CHANGE** that requires all snapshots to be regenerated. Please see tools section from README.md for quick approval of new snapshots
- Added cli tools to approve and discard snapshots in bulk

## 0.5.0 / 2020-10-31

### :tada: Enhancements

- add compare image options to the custom jest matcher

## 0.4.0 / 2020-10-31

### :tada: Enhancements

- [#15](https://github.com/moshensky/pdf-visual-diff/pull/15): Exclude regions from diff

## 0.3.0 / 2020-09-12

### :tada: Enhancements

- Add custom jest matcher

## 0.2.1 / 2020-09-11

- Fix package publish
- Fix highlight color

## 0.2.0 / 2020-09-11

### :tada: Enhancements

- [#6](https://github.com/moshensky/pdf-visual-diff/pull/6): Allow configuration of compare-images
