# Changelog

All notable changes to `deck-ir` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 — 2026-06-17

Initial public release.

### Added

- **Deterministic PPTX→HTML rendering core**, extracted from flash-deck's PPTX→HTML engine. Pure JavaScript — no PowerPoint, no headless browser, no cloud. Only `jszip` + `fast-xml-parser` as dependencies.
- **`parsePptx(buffer, options?)` API** returning `{ slideSize, slides, media }` — one faithful HTML fragment per slide, with per-slide warnings.
- **Fidelity:** shapes (rect / ellipse / line / custom geometry), fills (solid / gradient / image), outlines, border-radius, text (font / size / color / bold / italic / underline / alignment / bullets), images (with `srcRect` crop), 3-layer master/layout/slide background merge, color-scheme resolution (scheme / preset / `lumMod` → hex), z-order, groups, and SmartArt (cached drawing). EMU→px absolute positioning.
- **Media handling:** self-contained `data:` URLs by default, or bring-your-own URLs via the `mediaResolver` option.
- **Advanced exports:** `parsePptxToRawIR`, `transformToSemanticIR`, `emitSlideHtml`, plus types `ParseOptions` / `ParsedDeck` / `RawIR` / `SemanticIR`.
- **CLI example** (`examples/render.mjs`) and a bundled example deck (`examples/百纳维.pptx`).
- **Tests:** 50 test files / 193 tests (Vitest) covering colors, geometry, units, text, raw IR, semantic IR, and a golden snapshot.
