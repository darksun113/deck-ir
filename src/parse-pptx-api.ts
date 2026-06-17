// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

// src/parse-pptx-api.ts
// Public one-shot API: parsePptx(buffer, options) → ParsedDeck.
// Orchestrates raw → semantic → emit, and resolves each picture's embedId
// (rId) + owner (kind/id) to a physical media file, emitting a data: URL by
// default (or the user-supplied mediaResolver).
//
// parsePptxToSemantic(...) exposes the same raw→semantic+media core WITHOUT the
// final HTML emit, for downstream consumers (deck-ir-vlm) that emit their own
// HTML over the SemanticSlide objects + the shared resolveMedia closure.

import type { ParserContext } from './index';
import type { SemanticSlide } from './ir/semantic';
import type { ResolveMedia } from './emit/element-html';
import type { CollectorLogger } from './logger';
import { parsePptxToRawIR } from './raw/parse-pptx';
import { transformToSemanticIR } from './semantic/transform';
import { emitSlideHtml } from './emit/slide-html';
import { createCollectorLogger, composeLoggers, createNoopLogger } from './logger';
import type { ParseOptions, ParsedDeck, SemanticParse } from './api-types';

/** internalPath / file extension → MIME type (mirrors raw collectFromLayer, plus emf/wmf/bmp/webp). */
function mimeFromPath(path: string): string {
  const ext = (path.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'emf':
      return 'image/x-emf';
    case 'wmf':
      return 'image/x-wmf';
    default:
      return 'application/octet-stream';
  }
}

/** Node Buffer (or Uint8Array) → Uint8Array, without copying when already a Uint8Array. */
function toUint8Array(buf: Uint8Array | Buffer): Uint8Array {
  return buf instanceof Uint8Array ? buf : new Uint8Array(buf as ArrayBufferLike);
}

/** Composite key matching flash-deck's media-url-map.ts compositeKey(ownerKind, ownerId, embedId). */
function compositeKey(ownerKind: string, ownerId: string, embedId: string): string {
  return `${ownerKind}::${ownerId}::${embedId}`;
}

/** Shared raw→semantic+media core for both public entry points (no HTML emit). */
interface SemanticCore extends SemanticParse {
  /** Collector exposed so parsePptx can bucket per-slide warnings; internal only. */
  collector: CollectorLogger;
}

async function parseToSemanticCore(
  buffer: Uint8Array | ArrayBuffer,
  options: ParseOptions,
): Promise<SemanticCore> {
  // 1. collector (for bucketing warnings) composed with the user's logger (or noop).
  const collector = createCollectorLogger();
  const userLogger = options.logger;
  const passthrough = userLogger
    ? {
        apply: () => {},
        warn: (e: { message: string; context: { slideRef?: string; element?: string } }) => {
          const slide = e.context.slideRef ? ` [${e.context.slideRef}]` : '';
          const elem = e.context.element ? ` (${e.context.element})` : '';
          userLogger.warn(`[warn]${slide}${elem} ${e.message}`);
        },
        error: () => {},
      }
    : createNoopLogger();
  const logger = composeLoggers([collector, passthrough]);

  // 2. raw IR (parsePptxToRawIR loads via JSZip internally; readZipEntry is unused).
  const ctx: ParserContext = {
    logger,
    readZipEntry: async () => {
      throw new Error('unused');
    },
  };
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const raw = await parsePptxToRawIR(Buffer.from(bytes), ctx);

  // 3. semantic IR
  const semantic = transformToSemanticIR(raw, logger);

  // 4. media map keyed by internalPath (stable, dedup-friendly across embedIds/owners).
  const media: ParsedDeck['media'] = new Map();
  // (embedId, ownerKind, ownerId) → internalPath, replicating flash-deck's compositeKey lookup.
  const keyToPath = new Map<string, string>();
  for (const asset of raw.mediaAssets) {
    const mimeType = mimeFromPath(asset.internalPath);
    if (!media.has(asset.internalPath)) {
      media.set(asset.internalPath, { buffer: toUint8Array(asset.buffer), mimeType });
    }
    keyToPath.set(compositeKey(asset.ownerKind, asset.ownerId, asset.embedId), asset.internalPath);
  }

  // 5. resolveMedia: (embedId, ownerKind, ownerId) → physical internalPath → src.
  const resolveMedia: ResolveMedia = (embedId, ownerKind, ownerId) => {
    const internalPath = keyToPath.get(compositeKey(ownerKind, ownerId, embedId));
    if (!internalPath) {
      logger.warn({
        decisionId: 'media',
        message: `cannot resolve media embedId=${embedId} owner=${ownerKind}:${ownerId}`,
        context: { element: 'p:pic' },
      });
      return '';
    }
    const entry = media.get(internalPath);
    if (!entry) {
      logger.warn({
        decisionId: 'media',
        message: `media entry missing for internalPath=${internalPath}`,
        context: { element: 'p:pic' },
      });
      return '';
    }
    if (options.mediaResolver) return options.mediaResolver(internalPath, entry);
    const base64 = Buffer.from(entry.buffer).toString('base64');
    return `data:${entry.mimeType};base64,${base64}`;
  };

  return { slideSize: semantic.slideSize, slides: semantic.slides, media, resolveMedia, collector };
}

export async function parsePptx(
  buffer: Uint8Array | ArrayBuffer,
  options: ParseOptions = {},
): Promise<ParsedDeck> {
  const { slideSize, slides: semanticSlides, media, resolveMedia, collector } =
    await parseToSemanticCore(buffer, options);

  // slides + per-slide warnings (bucketed by collector's slideRef === slide.id).
  const slides = semanticSlides.map((slide) => {
    const html = emitSlideHtml(slide, slideSize, resolveMedia);
    const warnings = collector
      .toEvents()
      .filter(({ event }) => event.context.slideRef === slide.id)
      .map(({ level, event }) => {
        const elem = event.context.element ? ` (${event.context.element})` : '';
        return `[${level}]${elem} ${event.message}`;
      });
    return { html, warnings };
  });

  return { slideSize, slides, media };
}

/**
 * Lower-level entry point: parse to SemanticSlide[] + a ready resolveMedia
 * closure + the media map, WITHOUT emitting HTML. For downstream layers
 * (deck-ir-vlm) that render their own HTML — pair with emitSlideHtml or a
 * custom emitter over the same slides/resolveMedia.
 */
export async function parsePptxToSemantic(
  buffer: Uint8Array | ArrayBuffer,
  options: ParseOptions = {},
): Promise<SemanticParse> {
  const { slideSize, slides, media, resolveMedia } = await parseToSemanticCore(buffer, options);
  return { slideSize, slides, media, resolveMedia };
}
