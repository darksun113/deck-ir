# deck-ir

> Faithfully render PowerPoint `.pptx` into HTML — in pure JavaScript. No PowerPoint, no headless browser, no cloud.

[![npm version](https://img.shields.io/npm/v/deck-ir?color=cb3837&logo=npm)](https://www.npmjs.com/package/deck-ir)
[![license](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)
[![CI](https://img.shields.io/badge/CI-passing-brightgreen.svg)](./.github/workflows/ci.yml)

`deck-ir` is a deterministic rendering core that turns a `.pptx` buffer into one faithful HTML fragment per slide. It is the open-source rendering engine extracted from [flash-deck](https://flashdeck.cn)'s PPTX→HTML pipeline.

## What it is

Most tools that "convert PowerPoint to HTML" either shell out to PowerPoint / LibreOffice, spin up a headless browser, or send your deck to a cloud service. `deck-ir` does none of that. It reads the OOXML directly and reproduces the slide layout with rule-level fidelity:

- **Pure JS.** Runs anywhere Node runs. Only two dependencies: `jszip` + `fast-xml-parser`. No Chromium, no native binaries, no LLM, no storage.
- **Browser-faithful.** Shapes, fills, outlines, text runs, images, color schemes, and the 3-layer master/layout/slide background merge are resolved into absolute-positioned HTML/SVG (EMU→px).
- **Deterministic.** The same `.pptx` always produces the same HTML. No model, no randomness.
- **Self-contained output.** By default, media is inlined as `data:` URLs, so each slide's HTML fragment stands on its own.

## Demo / Screenshots

All screenshots below render the example deck [`examples/百纳维.pptx`](./examples/百纳维.pptx).

**Cover slide, rendered by deck-ir:**

![deck-ir rendered cover slide](./docs/render-slide1.png)

**Content slide, rendered by deck-ir:**

![deck-ir rendered content slide](./docs/render-slide4.png)

**Before / after** — the same cover slide rendered by PowerPoint/LibreOffice (left, source) vs. deck-ir (right):

| Source (LibreOffice) | deck-ir |
| --- | --- |
| ![source slide rendered by LibreOffice](./docs/source-slide1.png) | ![same slide rendered by deck-ir](./docs/render-slide1.png) |

## Install

```bash
npm i deck-ir
```

## Usage

```ts
import { parsePptx } from "deck-ir";

const { slideSize, slides, media } = await parsePptx(buffer, options?);
// slideSize: { w, h }  (px)
// slides: Array<{ html: string; warnings: string[] }>   // one faithful HTML fragment per slide
// media: Map<string, { buffer: Uint8Array; mimeType: string }>
```

`buffer` is the raw bytes of a `.pptx` file (a `Uint8Array`, `Buffer`, or `ArrayBuffer`).

### Media handling

By default, every image referenced by the deck is **inlined as a `data:` URL** directly into the slide HTML, so the output is fully self-contained — you can drop a slide's `html` into any page and it just works.

If you'd rather host media yourself (e.g. upload to a CDN and reference by URL), pass a `mediaResolver`:

```ts
const { slides } = await parsePptx(buffer, {
  // Return the URL you want emitted for this media item.
  mediaResolver: (id, { buffer, mimeType }) => {
    const url = uploadToCdn(id, buffer, mimeType);
    return url;
  },
  // Optional: route warnings somewhere of your choosing.
  logger: { warn: (msg) => console.warn(msg) },
});
```

### Options

| Option | Type | Default |
| --- | --- | --- |
| `mediaResolver` | `(id, { buffer, mimeType }) => string` | Inline `data:` URLs (self-contained HTML) |
| `logger` | `{ warn(msg): void }` | No-op |

### Advanced exports

For finer control over the pipeline, `deck-ir` also exposes the staged transforms and their types:

```ts
import {
  parsePptxToRawIR,    // .pptx bytes  → RawIR        (faithful OOXML model)
  transformToSemanticIR, // RawIR      → SemanticIR   (resolved colors/layout/lineage)
  emitSlideHtml,       // SemanticIR slide → HTML fragment
} from "deck-ir";

import type { ParseOptions, ParsedDeck, RawIR, SemanticIR } from "deck-ir";
```

This lets you inspect or post-process the intermediate representation before HTML is emitted.

## Example / CLI

A runnable example ships in `examples/`:

```bash
node examples/render.mjs examples/百纳维.pptx out.html
```

Open `out.html` in any browser — it renders like the original deck.

![full deck rendered by deck-ir](./docs/render-deck.png)

## What it renders

- **Shapes** — rect / ellipse / line / custom geometry → `div` / inline SVG
- **Fills** — solid, gradient, image (picture) fills
- **Outlines** — color, weight, dash
- **Border radius** — rounded-rectangle corners
- **Text** — font family, size, color, bold, italic, underline, alignment, bullets
- **Images** — including `srcRect` crop
- **Backgrounds** — 3-layer master / layout / slide background merge
- **Colors** — scheme / preset / `lumMod` etc. resolved to hex
- **Z-order** — shapes stacked in document order
- **Groups** — nested group transforms
- **SmartArt** — rendered from its cached drawing
- **Positioning** — EMU→px absolute layout

## Known limitations

`deck-ir` is honest about what it cannot (yet) do:

- **Charts / tables** without a cached drawing fall back to a **placeholder**.
- **Animations, transitions, audio, and video** are **ignored** — output is static.
- **Shadows and 3D effects** may be **partial**.
- **Fonts are NOT embedded.** Slides emit `font-family` names only, so rendering depends on the viewer having those fonts installed. **CJK text needs CJK fonts on the viewing machine.**

## Testing

- **Unit + golden:** 50 test files / 193 tests run under [Vitest](https://vitest.dev), covering colors, geometry, units, text, the raw IR, the semantic IR, plus a golden snapshot.

  ```bash
  pnpm test
  ```

- **Honest caveat:** the unit tests cover the **deterministic transforms** (the parts where a known input must produce a known output). **Visual fidelity** is currently verified by **eyeballing the example output** against the source render (see the before/after above) — it is **not** auto-asserted pixel-for-pixel. If you find a slide that renders wrong, an issue with the offending `.pptx` is the most useful thing you can send.

## Roadmap

- Optional VLM module — cluster slides into editable templates + auto-label
- PPTX export
- Font embedding
- Chart / table rendering
- More effects (shadows, 3D, transitions)

## Want more? (flash-deck)

`deck-ir` is the open **rendering core**. The full product — **AI one-line → full PPT**, editable HTML templates, presenter mode, **export to editable PPTX**, and mermaid diagrams — lives at **[flash-deck (flashdeck.cn)](https://flashdeck.cn)**.

If you want the whole pipeline rather than just the renderer, start there.

## License

`deck-ir` is licensed under **[AGPL-3.0-only](./LICENSE)**.

The AGPL covers any use, **including network / SaaS use**: if you build on `deck-ir` and offer it over a network, your derivative must also be open-sourced under AGPL-3.0.

For **closed-source or commercial use without AGPL obligations**, a **commercial dual-license** is available — see [COMMERCIAL.md](./COMMERCIAL.md) or contact **mtion@msn.com**.

Copyright (C) 2026 deck-ir authors.
