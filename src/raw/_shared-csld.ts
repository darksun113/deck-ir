// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RawCSld, RawBackground, RawFill, RawShape, RawPicture, RawGroupShape, RawGraphicFrame } from '../ir/raw';
import { parseShape, parseColor, parseConnector } from './element-sp';
import { parsePicture, type PictureCtx } from './element-pic';
import { parseGroupShape } from './element-grpsp';
import { parseGraphicFrame } from './element-graphic-frame';
import { resolveMcAlternateContent, isElementSupportedNamespace } from '../rules/unsupported/mc-alternate';
import { reuseInkAsShape } from '../rules/unsupported/ink';
import { parseGradFill } from '../rules/colors/gradient-fill';

type XmlNode = Record<string, unknown>;

export function toArray<T = XmlNode>(x: T | T[] | undefined | null): T[] {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

export function attr(n: XmlNode | undefined, key: string): string | undefined {
  if (!n) return undefined;
  const v = n[`@_${key}`];
  return typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;
}

export function emuNum(s: string | undefined): number | undefined {
  if (s === undefined) return undefined;
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

export function parseCSld(cSldNode: XmlNode | undefined | null, ctx: PictureCtx = { mediaRefs: {} }): RawCSld {
  if (!cSldNode) return { bg: null, spTree: { children: [] } };
  const bg = parseBackground(cSldNode['p:bg'] as XmlNode | undefined);
  const spTreeNode = cSldNode['p:spTree'] as XmlNode | undefined;
  const children = spTreeNode ? parseSpTreeChildren(spTreeNode, ctx) : [];
  return { bg, spTree: { children } };
}

export function parseSpTreeChildren(spTree: XmlNode, ctx: PictureCtx): Array<RawShape | RawPicture | RawGroupShape | RawGraphicFrame> {
  const out: Array<RawShape | RawPicture | RawGroupShape | RawGraphicFrame> = [];

  // W2: 先处理 mc:AlternateContent 包装器
  for (const mc of toArray(spTree['mc:AlternateContent'])) {
    const mcNode = mc as Record<string, unknown>;
    const choices = mcNode['mc:Choice'] as unknown;
    const fallback = mcNode['mc:Fallback'] as unknown;
    // fxp 解 mc:Choice 是 attributes + children flat 形式, 转成 resolveMcAlternateContent 需要的 McChoice 格式
    const wrappedChoices = (Array.isArray(choices) ? choices : choices ? [choices] : []).map((c) => {
      const cnode = c as Record<string, unknown>;
      const requires = (cnode['@_Requires'] as string) ?? '';
      const children = Object.entries(cnode)
        .filter(([k]) => !k.startsWith('@_'))
        .map(([k, v]) => ({ [k]: v }));
      return { '@_Requires': requires, children };
    });
    const fallbackChildren = fallback ? Object.entries(fallback as Record<string, unknown>)
      .filter(([k]) => !k.startsWith('@_'))
      .map(([k, v]) => ({ [k]: v })) : undefined;

    const adapted = {
      '@_': {},
      'mc:Choice': wrappedChoices.length === 1 ? wrappedChoices[0] : wrappedChoices,
      'mc:Fallback': fallbackChildren ? { children: fallbackChildren } : undefined,
    };
    const selected = resolveMcAlternateContent(adapted, isElementSupportedNamespace, ctx.logger, { slideRef: ctx.slideRef });
    if (!selected) continue;

    // selected: unknown[] (each is { 'p:sp': {...} } 等 single-key wrapped object), 累积到 synthesized spTree
    const synthesizedSpTree: XmlNode = {};
    for (const item of selected) {
      const obj = item as Record<string, unknown>;
      for (const [k, v] of Object.entries(obj)) {
        if (synthesizedSpTree[k] === undefined) synthesizedSpTree[k] = v;
        else synthesizedSpTree[k] = [...toArray(synthesizedSpTree[k]), ...toArray(v as XmlNode)];
      }
    }
    // 递归解析选中内容
    const nested = parseSpTreeChildren(synthesizedSpTree, ctx);
    out.push(...nested);
  }

  // 然后处理普通 spTree 子元素
  for (const sp of toArray(spTree['p:sp'])) out.push(parseShape(sp as XmlNode, { logger: ctx.logger, slideRef: ctx.slideRef, custGeomPaths: ctx.custGeomPaths }));
  for (const cxn of toArray(spTree['p:cxnSp'])) out.push(parseConnector(cxn as XmlNode, { logger: ctx.logger, slideRef: ctx.slideRef, custGeomPaths: ctx.custGeomPaths }));
  for (const pic of toArray(spTree['p:pic'])) out.push(parsePicture(pic as XmlNode, ctx));
  for (const grp of toArray(spTree['p:grpSp'])) out.push(parseGroupShape(grp as XmlNode, ctx));
  for (const gf of toArray(spTree['p:graphicFrame'])) out.push(parseGraphicFrame(gf as XmlNode));

  // W5: p:ink 孤立出现 → log + skip (常态走 mc:Fallback 已被 W2 cover)
  for (const _ink of toArray(spTree['p:ink'])) {
    reuseInkAsShape(ctx.logger, { slideRef: ctx.slideRef });
    // ink 不 push 到 out (真"复用 sp 路径"留 Plan 2 element-ink.ts)
  }

  // 2D-A: 按文档序恢复 z-order (OOXML 文档序 = 后出现的 = 更上层)
  if (ctx.orderIndex) {
    out.sort((a, b) => (ctx.orderIndex!.get(a.id) ?? 0) - (ctx.orderIndex!.get(b.id) ?? 0));
  }

  return out;
}

function parseBackground(bgNode: XmlNode | undefined | null): RawBackground | null {
  if (!bgNode) return null;
  const bgPr = bgNode['p:bgPr'] as XmlNode | undefined;
  const bgRef = bgNode['p:bgRef'] as XmlNode | undefined;
  if (bgRef) {
    return {
      bgRef: {
        idx: parseInt((bgRef['@_idx'] as string | undefined) ?? '0', 10),
        color: parseColor(bgRef),
      },
    };
  }
  if (bgPr) {
    return { bgPr: { fill: parseBgFill(bgPr) } };
  }
  return null;
}

function parseBgFill(bgPr: XmlNode): RawFill {
  if (bgPr['a:noFill']) return { type: 'none' };
  const solid = bgPr['a:solidFill'] as XmlNode | undefined;
  if (solid) return { type: 'solid', color: parseColor(solid) };
  const grad = bgPr['a:gradFill'] as XmlNode | undefined;
  if (grad) return parseGradFill(grad);                       // C1
  const blip = bgPr['a:blipFill'] as XmlNode | undefined;
  if (blip) {
    const b = blip['a:blip'] as XmlNode | undefined;
    const srcRect = blip['a:srcRect'] as XmlNode | undefined;
    const tileNode = blip['a:tile'] as XmlNode | undefined;
    return {
      type: 'blip',
      blipRef: {
        embed: attr(b, 'r:embed'),
        link: attr(b, 'r:link'),
        srcRect: srcRect ? {
          l: emuNum(attr(srcRect, 'l')),
          t: emuNum(attr(srcRect, 't')),
          r: emuNum(attr(srcRect, 'r')),
          b: emuNum(attr(srcRect, 'b')),
        } : undefined,
        tile: tileNode ? {
          sx: emuNum(attr(tileNode, 'sx')),
          sy: emuNum(attr(tileNode, 'sy')),
          tx: emuNum(attr(tileNode, 'tx')),
          ty: emuNum(attr(tileNode, 'ty')),
          algn: attr(tileNode, 'algn'),
        } : undefined,
        stretch: blip['a:stretch'] !== undefined,
      },
    };
  }
  return { type: 'none' };
}
