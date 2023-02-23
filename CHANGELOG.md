# Changelog

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
