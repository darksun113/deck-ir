// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

// 用法 / Usage: node examples/render.mjs <input.pptx> [out.html]
import { parsePptx } from "../dist/index.js";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath = "out.html"] = process.argv;
if (!inPath) {
  console.error("Usage: node examples/render.mjs <input.pptx> [out.html]");
  process.exit(1);
}
const { slideSize, slides } = await parsePptx(new Uint8Array(readFileSync(inPath)));
const body = slides
  .map((s) => `<div style="margin:16px auto;box-shadow:0 2px 12px rgba(0,0,0,.15)">${s.html}</div>`)
  .join("\n");
writeFileSync(
  outPath,
  `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#eee;display:flex;flex-direction:column;align-items:center">${body}</body>`,
);
console.log(`✓ ${slides.length} slides → ${outPath}  (slide ${slideSize.w}×${slideSize.h})`);
