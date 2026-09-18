# Snapshot Mode Requirements

## Scope

- Expose a `snapshotMode` option with the values `'single-image' | 'per-page'`; `'single-image'` remains the default. Reserve `'auto'` for future expansion but do not implement it yet.
- Preserve the existing single-image snapshot workflow (single PNG plus `.new` and `.diff` companions) when `snapshotMode` is omitted or set to `'single-image'`.
- Introduce per-page snapshotting when `snapshotMode: 'per-page'` is provided while keeping both modes mutually exclusive per snapshot name.

## Manifest Contract

- The manifest file MUST be valid JSON encoded in UTF-8, created when the baseline is first written (only for `snapshotMode: 'per-page'`), and updated only when the baseline changes (manual refresh or CLI promotion). Single-image snapshots continue to rely on the existing flat files and do not have a manifest.
- Top-level fields:
  - `schemaVersion` (number) – starts at `1`.
  - `snapshotName` (string) – must match the directory name.
  - `snapshotMode` (string) – `'single-image'` or `'per-page'`.
  - `hashAlgorithm` (string) – set to `'sha256'`.
  - `lastUpdated` (ISO 8601 string) – timestamp of the latest successful baseline write.
- The number of baseline pages is `pages.length`. Derive filename zero-padding as `String(pages.length).length` whenever writing or reading per-page files, and treat the 1-based page index as the array position plus one.
- `source` (object) – captures how the PDF was rendered. Must include `dpi` (number) and `inputType` (`'path' | 'buffer'`). When `inputType === 'path'`, include `pdfPath` (string). Additional fields may be added in future schema versions.
  - `pages` (array) – page descriptors ordered as they appear in the baseline; the 1-based index is implied by array position.
- Each page descriptor MUST include:
  - `hash` (string) – SHA-256 digest of the baseline PNG encoded as lowercase hex.
  - `dimensions` (object with `width`, `height` numbers in pixels).
- The manifest MUST be rewritten after any change that modifies per-page baseline images or snapshot mode. Deleting the per-page baseline MUST also remove `manifest.json`.

### Example Manifest

```json
{
  "schemaVersion": 1,
  "snapshotName": "invoice",
  "snapshotMode": "per-page",
  "hashAlgorithm": "sha256",
  "lastUpdated": "2025-02-11T09:15:42.318Z",
  "source": {
    "inputType": "path",
    "pdfPath": "test-data/pdfs/invoice.pdf",
    "dpi": 144
  },
  "pages": [
    {
      "hash": "3f8a0bb86e9a7dfc4c8f4b7923f54ecb",
      "dimensions": { "width": 2550, "height": 3300 }
    }
  ]
}
```

## Output Layout (Per-Page Mode)

- Store per-page artefacts under `__snapshots__/<snapshotName>/` alongside `manifest.json` (which is created during baseline creation as described above).
- Required subdirectories:
  - `baseline/` – baseline PNGs (`page-###.png`) using zero-padding derived from `String(manifest.pages.length).length`.
  - `actual/` – artefacts generated during comparisons; reuse the baseline padding for existing pages.
  - `diff/` – visual diffs for mismatched pages; reuse the baseline padding for existing pages.
- Newly added pages may require wider padding. In that case, name the new `actual`/`diff` files using a pad width equal to the larger of `String(manifest.pages.length).length` and the number of digits in the current render’s page count, so filenames match the width that the next baseline will adopt.
- Optional future diagnostics (e.g., thumbnails) must live alongside the manifest or in dedicated subfolders without altering the required structure.

## Behaviour Requirements

- **Baseline Creation:** When no snapshot exists and `snapshotMode: 'per-page'` is requested, render each page, compute the filename padding as the number of digits in the rendered page count, write baseline PNGs using that width (path pattern `baseline/page-<zero padded index>.png`), populate `manifest.pages` in the order rendered, and return success unless `failOnMissingSnapshot` is `true`.
- **Comparisons:** When comparing to an existing per-page snapshot:
  - Iterate over `manifest.pages` in order, derive baseline PNG paths using `baselinePadWidth = String(manifest.pages.length).length` (pattern `baseline/page-<zero padded index>.png`), and compare against the freshly rendered pages from the current run.
  - For pages that exist in the manifest, reuse `baselinePadWidth` when writing matching `actual`/`diff` filenames (index implied by array position).
  - Treat rendered pages beyond the manifest length as newly added; create corresponding `actual`/`diff` artefacts using `padWidth = max(baselinePadWidth, numberOfDigitsInCurrentRenderCount)` so only the new pages adopt a wider width when needed. (Here, `numberOfDigitsInCurrentRenderCount` is `String(totalPagesRenderedThisRun).length`, and `totalPagesRenderedThisRun` equals the number of rasterised pages produced during the current comparison.)
  - If the render produces fewer pages than the manifest describes, generate diff placeholders for the missing indices (using the derived baseline path) and do not create `actual` artefacts for those pages.
  - Populate the `actual` and `diff` folders only for pages that differ. Matching pages must have their existing `actual`/`diff` files removed if present.
- **Mode Mismatches:** If the stored manifest’s `snapshotMode` differs from the requested mode (including single-image artefacts without a manifest), abort the comparison or baseline creation with an error that names the snapshot, the detected mode, the requested mode, and the path the user must clean or regenerate.
- **Manifest Stability:** Comparisons must not rewrite `manifest.json`; only baseline creation or an explicit baseline refresh (e.g., CLI promotion) may update it.
- **Synthetic Diffs:** For missing or extra pages, generate a placeholder PNG in the `diff` folder that contains a solid banner in the top-left corner (16 px padding, consistent palette such as amber `#FFB300` for baseline-only pages and teal `#1ABC9C` for actual-only pages) with copy such as “Baseline has no page <index>” or “Actual run skipped page <index>”, where `<index>` equals the 1-based page position.
- **Hashing:** Use Node’s SHA-256 implementation to compute baseline hashes when writing files. Update `lastUpdated` only when manifest contents change (e.g., baseline rewritten).
- **Baseline Refresh:** Document that accepting new output requires deleting the existing baseline artefacts (entire `__snapshots__/<name>` directory for per-page mode, or `<name>.png`, `<name>.new.png`, and `<name>.diff.png` for single-image). On the next run—if `failOnMissingSnapshot` is `false`—a new baseline must be created automatically using the baseline-creation rules above.

## Constraints

- When writing or updating baseline PNGs or `manifest.json`, use atomic writes (temp file + rename) so mid-run failures cannot leave partial artefacts.
- Ensure behaviour is consistent across operating systems (path separators, case sensitivity).
- Preserve compatibility with existing single-image snapshots; per-page mode must never modify them.

## Validation Expectations

- Unit tests covering:
  - Manifest creation and updates (including filename padding adjustments during baseline rewrites).
  - Comparison success when per-page images match.
  - Detection of extra, missing, and changed pages (including synthetic diff banners).
  - Mode mismatch errors in both directions (single-image baseline vs per-page run, and vice versa).
- Integration or end-to-end tests demonstrating:
  - Baseline creation in per-page mode.
  - A failing comparison that produces `actual` and `diff` artefacts.
  - Cleanup of `actual`/`diff` files after a subsequent passing run.
  - Behaviour when `failOnMissingSnapshot` is `true`.
  - Diff placeholders generated when fewer pages render than the baseline describes.

## Stretch Goal: CLI Baseline Refresh

Extend the existing CLI with a `refresh-snapshot` command that:

- Validates the manifest and requested `snapshotMode` before making changes.
- Promotes the latest `actual` artefacts to the baseline (per snapshot name) when a failing comparison has produced them.
- Recomputes SHA-256 hashes for all promoted pages and updates `manifest.json` atomically.
- Determines the new padding width as `String(promotedPageCount).length` (handle both growth 99 → 100 and shrinkage 100 → 99) and rewrites filenames accordingly.
- Syncs the manifest `pages` array with the promoted baseline, adding or removing page descriptors to match the new page count before writing hashes and dimensions.
- Removes the `actual` and `diff` folders after successful promotion.
- Provides clear feedback when promotion is blocked (e.g., no `actual` artefacts present, mode mismatch, missing manifest).
- Operates strictly on the artefacts produced by the most recent comparison; the command must confirm that `actual`/`diff` PNGs exist and have modification times newer than the manifest’s `lastUpdated` (or that corresponding `.new`/`.diff` files exist in single-image mode). If this freshness check fails, the command must abort without modifying the baseline.
- For single-image snapshots, promote `<name>.new.png` to `<name>.png`, rewrite hashes in the manifest, and remove `<name>.new.png` and `<name>.diff.png` on success.
