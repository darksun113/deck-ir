// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { SemanticSlide } from './ir/semantic';
import type { ResolveMedia } from './emit/element-html';

export interface ParseOptions {
  /** Customize each image's src. Default: inline data: URL. */
  mediaResolver?: (id: string, media: { buffer: Uint8Array; mimeType: string }) => string;
  /** Warning sink. Default: swallow. */
  logger?: { warn: (msg: string) => void };
}

export interface ParsedDeck {
  slideSize: { w: number; h: number };
  slides: Array<{ html: string; warnings: string[] }>;
  media: Map<string, { buffer: Uint8Array; mimeType: string }>;
}

/**
 * Lower-level parse result: the semantic IR slides plus the media resolver,
 * for downstream consumers (e.g. deck-ir-vlm) that emit their own HTML and need
 * the SemanticSlide objects + a ready resolveMedia closure rather than finished
 * HTML. Use {@link emitSlideHtml}(slide, slideSize, resolveMedia) to render a
 * slide, or build an editable/alternate emitter over the same slides.
 */
export interface SemanticParse {
  slideSize: { w: number; h: number };
  slides: SemanticSlide[];
  media: Map<string, { buffer: Uint8Array; mimeType: string }>;
  resolveMedia: ResolveMedia;
}
