// src/emit/element-html.ts
// Generic SemanticIR → HTML element emitter.
// Ported from flash-deck's semanticElementToHtml, stripped of all VLM/business
// specifics: no data-cat/data-editable, no {{token}} editable slots, no textCatalog,
// no classification/mode params. Text is rendered as actual HTML-escaped content.
// Media URLs are resolved through an injected resolveMedia(...) callback.

import type {
  SemanticElement,
  SemanticTextBody,
} from '../ir/semantic';

/**
 * Resolves a picture/image-fill embed reference to a usable URL (e.g. an <img src>).
 * Caller (index.ts) supplies the concrete implementation (OSS key, data URI, file path, ...).
 */
export type ResolveMedia = (
  embedId: string,
  ownerKind: string,
  ownerId: string,
) => string;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** SemanticTextBody → inline HTML: paragraphs joined by <br>, run text concatenated + escaped. */
export function textBodyToInlineHtml(body: SemanticTextBody): string {
  return body.paragraphs
    .map((p) => escapeHtml(p.runs.map((r) => r.text).join('')))
    .join('<br>');
}

/** Whether this text body has any visible (non-whitespace) text. */
export function hasRenderableText(body: SemanticTextBody): boolean {
  return body.paragraphs.some((p) =>
    p.runs.some((r) => r.text.trim().length > 0),
  );
}

/** semantic outline css (`border: Wpx solid #C00000`) → {color, width}. Used for svg-line stroke. */
function strokeFromOutline(
  outline: { css: string } | null | undefined,
): { color: string; width: number } {
  const css = outline?.css ?? '';
  const w = css.match(/border:\s*([\d.]+)px/);
  const c = css.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/);
  return {
    color: c ? c[0] : 'black',
    width: w ? Math.max(1, parseFloat(w[1])) : 1,
  };
}

/** OOXML srcRect (1/1000% edge crop) → CSS object-position. Pairs with object-fit:cover. */
function srcRectToObjectPosition(sr?: {
  l?: number;
  t?: number;
  r?: number;
  b?: number;
}): string | null {
  if (!sr) return null;
  const l = sr.l ?? 0,
    t = sr.t ?? 0,
    r = sr.r ?? 0,
    b = sr.b ?? 0;
  if (!l && !t && !r && !b) return null;
  const x = l + r > 0 ? (l / (l + r)) * 100 : 50;
  const y = t + b > 0 ? (t / (t + b)) * 100 : 50;
  return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
}

/** Provenance attrs kept from the source element (harmless, no VLM semantics). */
function provenanceAttrs(id: string, source: string): string {
  return `data-id="${id}" data-source="${source}"`;
}

export function emitElementHtml(
  el: SemanticElement,
  resolveMedia: ResolveMedia,
): string {
  const { bbox, transform } = el;
  const source = el.sourceLayer;
  const prov = provenanceAttrs(el.id, source);
  const base = `position:absolute; left:${bbox.x}px; top:${bbox.y}px; width:${bbox.w}px; height:${bbox.h}px;${transform ? ` transform:${transform};` : ''}`;

  if (el.kind === 'shape') {
    const fill = el.fill?.css ?? '';
    const outline = el.outline?.css ?? '';

    // Shape with visible text → div with actual escaped text + run/paragraph styles.
    if (el.text && hasRenderableText(el.text)) {
      const inline = textBodyToInlineHtml(el.text);
      const bodyStyle = el.text.bodyStyle ?? '';
      // Representative run rStyle + first paragraph pStyle (already valid CSS, appended directly).
      const firstPara = el.text.paragraphs[0];
      const firstRun =
        el.text.paragraphs
          .flatMap((p) => p.runs)
          .find((r) => r.text.trim().length > 0) ?? firstPara?.runs[0];
      const rStyle = firstRun?.rStyle ?? '';
      const pStyle = firstPara?.pStyle ?? '';
      return `<div ${prov} style="${base} ${fill} ${outline} ${bodyStyle} ${pStyle} ${rStyle}">${inline}</div>`;
    }

    if (el.geometry.type === 'div') {
      const radius = el.geometry.cssRadius ?? '';
      return `<div ${prov} style="${base} ${fill} ${outline} ${radius}"></div>`;
    } else if (el.geometry.type === 'svg-line') {
      const g = el.geometry;
      // Horizontal/vertical lines (most decorative lines) render as a filled div so real
      // color+thickness show; only diagonal lines go through <svg>.
      const { color, width } = strokeFromOutline(el.outline);
      const horiz = Math.abs(g.y1 - g.y2) < 0.5;
      const vert = Math.abs(g.x1 - g.x2) < 0.5;
      if (horiz || vert) {
        const lstyle = horiz
          ? `position:absolute; left:${bbox.x}px; top:${bbox.y - width / 2}px; width:${bbox.w}px; height:${width}px;`
          : `position:absolute; left:${bbox.x - width / 2}px; top:${bbox.y}px; width:${width}px; height:${bbox.h}px;`;
        return `<div ${prov} style="${lstyle}${transform ? ` transform:${transform};` : ''} background:${color};"></div>`;
      }
      return `<svg ${prov} style="${base} overflow:visible;" viewBox="0 0 ${bbox.w} ${bbox.h}"><line x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}" stroke="${color}" stroke-width="${width}"/></svg>`;
    } else {
      const g = el.geometry;
      return `<svg ${prov} style="${base}" viewBox="${g.viewBox}"><path d="${g.d}" ${fill ? `fill="${fill.replace('background-color:', '').replace(';', '').trim()}"` : ''}/></svg>`;
    }
  }

  if (el.kind === 'image') {
    // Resolve the embed (rId) through the injected resolver instead of a mediaUrlMap.
    const src = resolveMedia(el.src, el.ownerKind, el.ownerId);
    // srcRect edge crop → object-fit:cover + object-position (only reveal crop region).
    const objPos = srcRectToObjectPosition(el.srcRect);
    const cropStyle = objPos
      ? ` object-fit:cover; object-position:${objPos};`
      : '';
    return `<img ${prov} style="${base}${cropStyle}" src="${src}" alt="${escapeHtml(el.alt)}"/>`;
  }

  if (el.kind === 'placeholder') {
    return `<div ${prov} style="${base} border: 1px dashed #999;" title="${escapeHtml(el.reason)}"></div>`;
  }

  return '';
}
