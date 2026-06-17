// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

// src/emit/slide-html.ts
// Generic SemanticIR → HTML slide emitter.
// Wraps a slide's elements in a positioned <section class="slide">, using the
// slide background css and slide pixel size. No VLM/business specifics.

import type { SemanticSlide } from '../ir/semantic';
import { emitElementHtml, type ResolveMedia } from './element-html';

export type { ResolveMedia } from './element-html';

export function emitSlideHtml(
  slide: SemanticSlide,
  slideSize: { w: number; h: number },
  resolveMedia: ResolveMedia,
): string {
  const bg = slide.background?.css ?? '';
  const inner = slide.elements
    .map((el) => emitElementHtml(el, resolveMedia))
    .join('');
  return `<section class="slide" style="position:relative;width:${slideSize.w}px;height:${slideSize.h}px;${bg}">${inner}</section>`;
}
