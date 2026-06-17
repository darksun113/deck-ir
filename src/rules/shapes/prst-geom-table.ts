// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RuleLogger } from '../../logger/types';
import { roundRectRadiusPx } from './round-rect-radius';

const META = {
  decisionId: '#33',
  ruleName: 'prstGeom MVP 7 个硬编码 + fallback 虚线占位',
  source: {
    mappingDoc: 'mapping.md 第 2 章 2.4.1.b + 2.4.1.c',
    mappingDocLine: 2568,
    decisionDoc: 'undecided-resolved.md #33',
    officialRef: 'ECMA-376 presetShapeDefinitions.xml',
  },
} as const;

export type SemanticGeometry =
  | { type: 'div'; cssRadius?: string }
  | { type: 'svg-line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'svg-path'; d: string; viewBox: string };

export interface PrstGeomResult {
  geometry: SemanticGeometry;
  warning?: string;
}

/** MVP P0 7 个 prst */
const MVP_PRSTS = new Set(['rect', 'roundRect', 'ellipse', 'line', 'triangle', 'diamond', 'hexagon']);

export function resolvePrstGeom(
  prst: string,
  bbox: { w: number; h: number },
  avLst?: Array<{ name: string; val: number }>,
  logger?: RuleLogger,
  ctx?: { slideRef?: string; shapeId?: string }
): PrstGeomResult {
  const adjVal = avLst?.find((g) => g.name === 'adj')?.val;
  let result: PrstGeomResult;

  switch (prst) {
    case 'rect':
      result = { geometry: { type: 'div' } };
      break;
    case 'roundRect': {
      const r = roundRectRadiusPx(bbox.w, bbox.h, adjVal);
      result = { geometry: { type: 'div', cssRadius: `border-radius: ${r}px;` } };
      break;
    }
    case 'ellipse':
      result = { geometry: { type: 'div', cssRadius: 'border-radius: 50%;' } };
      break;
    case 'line':
      // 追踪 #32: 统一 SVG line (不分水平/垂直/斜线)
      result = { geometry: { type: 'svg-line', x1: 0, y1: 0, x2: bbox.w, y2: bbox.h } };
      break;
    case 'triangle':
      result = { geometry: { type: 'svg-path', d: `M ${bbox.w / 2} 0 L 0 ${bbox.h} L ${bbox.w} ${bbox.h} Z`, viewBox: `0 0 ${bbox.w} ${bbox.h}` } };
      break;
    case 'diamond':
      result = { geometry: { type: 'svg-path', d: `M ${bbox.w / 2} 0 L ${bbox.w} ${bbox.h / 2} L ${bbox.w / 2} ${bbox.h} L 0 ${bbox.h / 2} Z`, viewBox: `0 0 ${bbox.w} ${bbox.h}` } };
      break;
    case 'hexagon': {
      const w = bbox.w, h = bbox.h;
      result = { geometry: { type: 'svg-path', d: `M ${w / 4} 0 L ${w * 3 / 4} 0 L ${w} ${h / 2} L ${w * 3 / 4} ${h} L ${w / 4} ${h} L 0 ${h / 2} Z`, viewBox: `0 0 ${w} ${h}` } };
      break;
    }
    default:
      // fallback: 虚线占位 (追踪 #33: 不 fallback 矩形,用户能看出"哪里不对")
      result = {
        geometry: { type: 'div', cssRadius: undefined },
        warning: `prstGeom "${prst}" 未实现(MVP),fallback 虚线占位`,
      };
  }
  logger?.apply({
    ...META, context: { element: 'a:prstGeom', ...ctx },
    input: { prst, bbox, avLstVal: adjVal }, output: { geometryType: result.geometry.type, hasWarning: !!result.warning },
  });
  if (result.warning && logger) {
    logger.warn({ decisionId: '#33', message: result.warning, context: { element: 'a:prstGeom', ...ctx } });
  }
  return result;
}

export function isMvpPrst(prst: string): boolean {
  return MVP_PRSTS.has(prst);
}
