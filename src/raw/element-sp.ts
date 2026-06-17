// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import type { RawShape, RawXfrm, RawFill, RawColor, RawOutline, RawStyleRef, RawTextBody, RawParagraph, RawTextRun, RawCustPath } from '../ir/raw';
import { attr, emuNum, toArray } from './_shared-csld';
import type { RuleLogger } from '../logger/types';
import { skip3DEffects } from '../rules/unsupported/three-d';
import { parseGradFill } from '../rules/colors/gradient-fill';

type XmlNode = Record<string, unknown>;

export interface ParseShapeCtx {
  logger?: RuleLogger;
  slideRef?: string;
  custGeomPaths?: Map<string, RawCustPath>;  // 修#2: shape id → custGeom 有序路径(预解析)
}

export function parseShape(spNode: XmlNode, ctx?: ParseShapeCtx): RawShape {
  const nvSpPr = spNode['p:nvSpPr'] as XmlNode | undefined;
  const cNvPr = nvSpPr?.['p:cNvPr'] as XmlNode | undefined;
  const nvPr = nvSpPr?.['p:nvPr'] as XmlNode | undefined;
  const ph = nvPr?.['p:ph'] as XmlNode | undefined;
  const spPr = spNode['p:spPr'] as XmlNode | undefined;

  const id = attr(cNvPr, 'id') ?? '';
  const name = attr(cNvPr, 'name');

  // W4: 3D 效果 warn (HTML/CSS 无法精确还原, 永久 skip → 按 2D 渲染)
  if (spPr?.['a:scene3d'] || spPr?.['a:sp3d']) {
    skip3DEffects(ctx?.logger, { slideRef: ctx?.slideRef, shapeId: id });
  }

  const pStyle = spNode['p:style'] as XmlNode | undefined;
  const styleRef = pStyle ? parseStyleRef(pStyle) : undefined;

  return {
    kind: 'sp',
    id,
    name,
    xfrm: parseXfrm(spPr?.['a:xfrm'] as XmlNode | undefined),
    geom: parseGeom(spPr, id, ctx),
    fill: parseFill(spPr),
    outline: parseOutline(spPr?.['a:ln'] as XmlNode | undefined),
    useBgFill: attr(spNode, 'useBgFill') === '1',
    ph: ph ? {
      type: attr(ph, 'type'),
      idx: attr(ph, 'idx'),
      sz: attr(ph, 'sz'),
      orient: attr(ph, 'orient'),
    } : undefined,
    styleRef,           // B2
    txBody: spNode['p:txBody'] !== undefined ? parseTxBody(spNode['p:txBody'] as XmlNode | string) : undefined,  // A1.1
  };
}

function parseStyleRef(pStyle: XmlNode): RawStyleRef {
  const out: RawStyleRef = {};
  const fillRef = pStyle['a:fillRef'] as XmlNode | undefined;
  if (fillRef) {
    const idx = parseInt(attr(fillRef, 'idx') ?? '0', 10);
    out.fillRef = { idx, color: parseColor(fillRef) };
  }
  const lnRef = pStyle['a:lnRef'] as XmlNode | undefined;
  if (lnRef) {
    const idx = parseInt(attr(lnRef, 'idx') ?? '0', 10);
    out.lineRef = { idx, color: parseColor(lnRef) };
  }
  const effectRef = pStyle['a:effectRef'] as XmlNode | undefined;
  if (effectRef) {
    const idx = parseInt(attr(effectRef, 'idx') ?? '0', 10);
    out.effectRef = { idx, color: parseColor(effectRef) };
  }
  const fontRef = pStyle['a:fontRef'] as XmlNode | undefined;
  if (fontRef) {
    out.fontRef = { idx: attr(fontRef, 'idx') ?? 'minor', color: parseColor(fontRef) };
  }
  return out;
}

/** cxnSp(连接形状/直线)→ RawShape。结构与 sp 同(spPr 含 xfrm/prstGeom/ln),
 *  仅非可视包装是 p:nvCxnSpPr 而非 p:nvSpPr。伪装成 sp 复用 parseShape 全部解析。
 *  cxnSp 无 txBody → text=null,按形状渲染(线)。 */
export function parseConnector(cxnNode: XmlNode, ctx?: ParseShapeCtx): RawShape {
  const asSp: XmlNode = {
    'p:nvSpPr': cxnNode['p:nvCxnSpPr'] as XmlNode,
    'p:spPr': cxnNode['p:spPr'] as XmlNode,
  };
  return parseShape(asSp, ctx);
}

export function parseXfrm(xfrmNode: XmlNode | undefined): RawXfrm | undefined {
  if (!xfrmNode) return undefined;
  const off = xfrmNode['a:off'] as XmlNode | undefined;
  const ext = xfrmNode['a:ext'] as XmlNode | undefined;
  const chOff = xfrmNode['a:chOff'] as XmlNode | undefined;
  const chExt = xfrmNode['a:chExt'] as XmlNode | undefined;
  return {
    off: off ? { x: emuNum(attr(off, 'x')) ?? 0, y: emuNum(attr(off, 'y')) ?? 0 } : undefined,
    ext: ext ? { cx: emuNum(attr(ext, 'cx')) ?? 0, cy: emuNum(attr(ext, 'cy')) ?? 0 } : undefined,
    chOff: chOff ? { x: emuNum(attr(chOff, 'x')) ?? 0, y: emuNum(attr(chOff, 'y')) ?? 0 } : undefined,
    chExt: chExt ? { cx: emuNum(attr(chExt, 'cx')) ?? 0, cy: emuNum(attr(chExt, 'cy')) ?? 0 } : undefined,
    rot: emuNum(attr(xfrmNode, 'rot')),
    flipH: attr(xfrmNode, 'flipH') === '1',
    flipV: attr(xfrmNode, 'flipV') === '1',
  };
}

function parseGeom(spPr: XmlNode | undefined, id?: string, ctx?: ParseShapeCtx): RawShape['geom'] {
  if (!spPr) return undefined;
  const prstGeom = spPr['a:prstGeom'] as XmlNode | undefined;
  if (prstGeom) {
    const avLst = prstGeom['a:avLst'] as XmlNode | undefined;
    const gd = toArray(avLst?.['a:gd']);
    return {
      prst: attr(prstGeom, 'prst'),
      avLst: gd.map((g) => ({
        name: attr(g as XmlNode, 'name') ?? '',
        val: parseInt(attr(g as XmlNode, 'fmla')?.replace(/^val\s*/, '') ?? '0', 10),
      })),
    };
  }
  // 修#2: custGeom → 用预解析的有序路径(custGeomPaths 查表),没有则占位
  const custGeom = spPr['a:custGeom'];
  if (custGeom) {
    const custPath = id ? ctx?.custGeomPaths?.get(id) : undefined;
    return custPath ? { custPath, avLst: [] } : { avLst: [] };
  }
  return undefined;
}

function parseFill(spPr: XmlNode | undefined): RawFill | undefined {
  if (!spPr) return undefined;
  if (spPr['a:noFill']) return { type: 'none' };
  const solid = spPr['a:solidFill'] as XmlNode | undefined;
  if (solid) return { type: 'solid', color: parseColor(solid) };
  const grad = spPr['a:gradFill'] as XmlNode | undefined;
  if (grad) return parseGradFill(grad);            // C1: 真解析 stops
  const blip = spPr['a:blipFill'] as XmlNode | undefined;
  if (blip) return parseBlipFill(blip);              // C2: 完整解析 srcRect/tile/stretch/alphaModFix
  const patt = spPr['a:pattFill'] as XmlNode | undefined;
  if (patt) {
    // C3: pattFill 退化 (实际罕见, 真渲染需要 SVG <pattern>, Plan 2 后续)
    return {
      type: 'pattern',
      pattPrst: attr(patt, 'prst') ?? 'pct50',
      color: parseColor(patt['a:fgClr'] as XmlNode ?? {}),
    };
  }
  return undefined;
}

function parseBlipFill(blipFillNode: XmlNode): RawFill {
  const b = blipFillNode['a:blip'] as XmlNode | undefined;
  const srcRect = blipFillNode['a:srcRect'] as XmlNode | undefined;
  const tileNode = blipFillNode['a:tile'] as XmlNode | undefined;
  const stretch = blipFillNode['a:stretch'] !== undefined;
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
      stretch,
      alphaModFix: emuNum(attr(b?.['a:alphaModFix'] as XmlNode | undefined, 'amt')),
    },
  };
}

function parseOutline(lnNode: XmlNode | undefined): RawOutline | undefined {
  if (!lnNode) return undefined;
  const w = emuNum(attr(lnNode, 'w'));
  const solid = lnNode['a:solidFill'] as XmlNode | undefined;
  return {
    width: w,
    color: solid ? parseColor(solid) : undefined,
  };
}

export function parseColor(colorContainer: XmlNode): RawColor | undefined {
  let inner: XmlNode | undefined;
  let type: RawColor['type'] | undefined;
  let val: string | undefined;

  const srgb = colorContainer['a:srgbClr'] as XmlNode | undefined;
  const scheme = colorContainer['a:schemeClr'] as XmlNode | undefined;
  const preset = colorContainer['a:prstClr'] as XmlNode | undefined;
  const sys = colorContainer['a:sysClr'] as XmlNode | undefined;

  if (srgb) { inner = srgb; type = 'srgb'; val = (attr(srgb, 'val') ?? '000000').toUpperCase(); }
  else if (scheme) { inner = scheme; type = 'scheme'; val = attr(scheme, 'val') ?? 'bg1'; }
  else if (preset) { inner = preset; type = 'preset'; val = attr(preset, 'val') ?? 'black'; }
  else if (sys) { inner = sys; type = 'sys'; val = attr(sys, 'val') ?? 'windowText'; }
  else return undefined;

  const modifiers = parseColorModifiers(inner);
  if (modifiers.length === 0) return { type, val };
  return { type, val, modifiers };
}

// ============ A1.1: parseTxBody (bodyPr + paragraphs + runs + a:br + a:fld 占位) ============

// 顶层 slide/layout/master XMLParser 用 stopNodes:['*.p:txBody'], txBody 进来是原始 inner XML 字符串
// → 用 preserveOrder 二次解析, 完整保留 a:r/a:br/a:fld 真实交错顺序
// 兼容老用法 (test 直接喂 object form), object 路径仍可用, 但失去 a:br 与 a:r 间的真实交错顺序
const _txInnerParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', preserveOrder: true });

function parseTxBody(txBodyNode: XmlNode | string): RawTextBody {
  // 字符串路径 (stopNodes 来的真实 PPTX 内容): 包成 a:p root + a 命名空间, preserveOrder 重解
  if (typeof txBodyNode === 'string') {
    const wrapped = `<p:txBody xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${txBodyNode}</p:txBody>`;
    const ordered = _txInnerParser.parse(wrapped) as Array<Record<string, unknown>>;
    const txChildren = (ordered[0]?.['p:txBody'] as Array<Record<string, unknown>>) ?? [];
    return parseTxBodyOrdered(txChildren);
  }
  // 对象路径 (test 直接喂 / 兼容老用法): 用 toArray + Object.entries, a:br 与 a:r 之间的真实交错顺序丢失
  const bodyPrNode = txBodyNode['a:bodyPr'] as XmlNode | undefined;
  const bodyPr = bodyPrNode ? {
    lIns: emuNum(attr(bodyPrNode, 'lIns')),
    rIns: emuNum(attr(bodyPrNode, 'rIns')),
    tIns: emuNum(attr(bodyPrNode, 'tIns')),
    bIns: emuNum(attr(bodyPrNode, 'bIns')),
    vert: attr(bodyPrNode, 'vert'),
    anchor: attr(bodyPrNode, 'anchor'),
  } : undefined;

  const paragraphs: RawParagraph[] = toArray(txBodyNode['a:p']).map((p) => parseParagraph(p as XmlNode));

  return { bodyPr, paragraphs };
}

// preserveOrder 解析结果 → RawTextBody (子节点是数组形式, attrs 在 :@ 键下)
function parseTxBodyOrdered(children: Array<Record<string, unknown>>): RawTextBody {
  let bodyPr: RawTextBody['bodyPr'] = undefined;
  const paragraphs: RawParagraph[] = [];
  for (const child of children) {
    const tag = Object.keys(child).find((k) => !k.startsWith(':@'));
    if (!tag) continue;
    if (tag === 'a:bodyPr') {
      const attrs = (child[':@'] as Record<string, unknown>) ?? {};
      bodyPr = {
        lIns: emuNum(strOrUndef(attrs['@_lIns'])),
        rIns: emuNum(strOrUndef(attrs['@_rIns'])),
        tIns: emuNum(strOrUndef(attrs['@_tIns'])),
        bIns: emuNum(strOrUndef(attrs['@_bIns'])),
        vert: strOrUndef(attrs['@_vert']),
        anchor: strOrUndef(attrs['@_anchor']),
      };
    } else if (tag === 'a:p') {
      paragraphs.push(parseParagraphOrdered(child[tag] as Array<Record<string, unknown>>, (child[':@'] as Record<string, unknown>) ?? {}));
    }
  }
  return { bodyPr, paragraphs };
}

function strOrUndef(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return String(v);
}

function parseParagraphOrdered(children: Array<Record<string, unknown>>, _pAttrs: Record<string, unknown>): RawParagraph {
  let pPr: RawParagraph['pPr'] = undefined;
  const runs: RawTextRun[] = [];
  for (const child of children) {
    const tag = Object.keys(child).find((k) => !k.startsWith(':@'));
    if (!tag) continue;
    if (tag === 'a:pPr') {
      const attrs = (child[':@'] as Record<string, unknown>) ?? {};
      const pPrChildren = (child[tag] as Array<Record<string, unknown>>) ?? [];
      const lnSpcChild = pPrChildren.find((c) => 'a:lnSpc' in c);
      let lnSpc: { pct?: number; pts?: number } | undefined;
      if (lnSpcChild) {
        const lnSpcInner = (lnSpcChild['a:lnSpc'] as Array<Record<string, unknown>>) ?? [];
        const spcPct = lnSpcInner.find((c) => 'a:spcPct' in c);
        const spcPts = lnSpcInner.find((c) => 'a:spcPts' in c);
        const spcPctVal = spcPct ? strOrUndef(((spcPct[':@'] as Record<string, unknown>) ?? {})['@_val']) : undefined;
        const spcPtsVal = spcPts ? strOrUndef(((spcPts[':@'] as Record<string, unknown>) ?? {})['@_val']) : undefined;
        lnSpc = { pct: emuNum(spcPctVal), pts: emuNum(spcPtsVal) };
      }
      pPr = {
        algn: strOrUndef(attrs['@_algn']),
        marL: emuNum(strOrUndef(attrs['@_marL'])),
        indent: emuNum(strOrUndef(attrs['@_indent'])),
        lnSpc,
        bullet: parseBulletOrdered(pPrChildren),       // A1.2
      };
    } else if (tag === 'a:r') {
      runs.push(parseRunOrdered(child[tag] as Array<Record<string, unknown>>, (child[':@'] as Record<string, unknown>) ?? {}));
    } else if (tag === 'a:br') {
      runs.push({ text: '\n' });
    } else if (tag === 'a:fld') {
      runs.push({ text: '[字段]' });
    }
  }
  return { pPr, runs };
}

function parseRunOrdered(children: Array<Record<string, unknown>>, _rAttrs: Record<string, unknown>): RawTextRun {
  // children 含 a:rPr / a:t (顺序固定: rPr 在前, t 在后)
  let rPrChild: Record<string, unknown> | undefined;
  let tChild: Record<string, unknown> | undefined;
  for (const c of children) {
    if ('a:rPr' in c) rPrChild = c;
    else if ('a:t' in c) tChild = c;
  }

  // 解出 a:t 文本: preserveOrder 下叶节点的 #text 数组形式: [{ '#text': '标题文本' }]
  let text = '';
  if (tChild) {
    const tInner = (tChild['a:t'] as Array<Record<string, unknown>>) ?? [];
    for (const seg of tInner) {
      if ('#text' in seg) text += String(seg['#text'] ?? '');
    }
  }

  if (!rPrChild) return { text };

  const rPrAttrs = (rPrChild[':@'] as Record<string, unknown>) ?? {};
  const rPrChildren = (rPrChild['a:rPr'] as Array<Record<string, unknown>>) ?? [];

  let color: RawColor | undefined;
  let latin: string | undefined;
  let ea: string | undefined;
  let cs: string | undefined;
  let sym: string | undefined;
  for (const c of rPrChildren) {
    if ('a:solidFill' in c) {
      // 把 preserveOrder 形态 reassemble 成 object 然后复用 parseColor
      const reassembled = reassemble({ tag: 'a:solidFill', child: c });
      color = parseColor(reassembled);
    } else if ('a:latin' in c) {
      latin = strOrUndef(((c[':@'] as Record<string, unknown>) ?? {})['@_typeface']);
    } else if ('a:ea' in c) {
      ea = strOrUndef(((c[':@'] as Record<string, unknown>) ?? {})['@_typeface']);
    } else if ('a:cs' in c) {
      cs = strOrUndef(((c[':@'] as Record<string, unknown>) ?? {})['@_typeface']);       // A1.3
    } else if ('a:sym' in c) {
      sym = strOrUndef(((c[':@'] as Record<string, unknown>) ?? {})['@_typeface']);      // A1.3
    }
  }

  return {
    rPr: {
      sz: emuNum(strOrUndef(rPrAttrs['@_sz'])),
      b: strOrUndef(rPrAttrs['@_b']) === '1',
      i: strOrUndef(rPrAttrs['@_i']) === '1',
      u: strOrUndef(rPrAttrs['@_u']),
      color,
      latin,
      ea,
      cs,                                                                                // A1.3
      sym,                                                                               // A1.3
      strike: strOrUndef(rPrAttrs['@_strike']),                                          // A1.3
      baseline: emuNum(strOrUndef(rPrAttrs['@_baseline'])),                              // A1.3
    },
    text,
  };
}

// preserveOrder { tag: <name>, child: { [name]: <kids[]>, ':@': <attrs> } } → 旧式 object 形态 (供 parseColor 复用)
function reassemble({ tag: _tag, child }: { tag: string; child: Record<string, unknown> }): XmlNode {
  const out: XmlNode = {};
  const kidsTag = Object.keys(child).find((k) => !k.startsWith(':@'));
  if (!kidsTag) return out;
  const kids = (child[kidsTag] as Array<Record<string, unknown>>) ?? [];
  const attrs = (child[':@'] as Record<string, unknown>) ?? {};
  // 把当前节点 attrs 提到 out (键以 @_ 开头), 但 parseColor 看的是 inner 元素本身; 所以构造 inner
  const merged: XmlNode = { ...attrs };
  for (const k of kids) {
    const innerTag = Object.keys(k).find((kk) => !kk.startsWith(':@'));
    if (!innerTag) continue;
    const innerAttrs = (k[':@'] as Record<string, unknown>) ?? {};
    const innerKidsArr = (k[innerTag] as Array<Record<string, unknown>>) ?? [];
    const innerMerged: XmlNode = { ...innerAttrs };
    // 递归一层 (修饰符如 lumMod 本身是叶子)
    for (const sub of innerKidsArr) {
      const subTag = Object.keys(sub).find((kkk) => !kkk.startsWith(':@'));
      if (!subTag) continue;
      const subAttrs = (sub[':@'] as Record<string, unknown>) ?? {};
      innerMerged[subTag] = { ...subAttrs };
    }
    merged[innerTag] = innerMerged;
  }
  return merged;
}

// A1.1: 单例 builder/parser 用于段落子节点排序恢复 (a:r/a:br/a:fld 交错时)
// fast-xml-parser 默认按 key 合并同名节点 → 失去 a:r 与 a:br/a:fld 的真实交错次序;
// 我们 rebuild 一遍 + preserveOrder 重解, 仅用于读取 r/br/fld 出现序列 (索引到原 a:r 数组复用 parseRun)
const _txBuilder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', suppressEmptyNode: true });
const _txOrderedParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', preserveOrder: true });

function parseParagraph(pNode: XmlNode): RawParagraph {
  const pPrNode = pNode['a:pPr'] as XmlNode | undefined;
  const pPr = pPrNode ? {
    algn: attr(pPrNode, 'algn'),
    marL: emuNum(attr(pPrNode, 'marL')),
    indent: emuNum(attr(pPrNode, 'indent')),
    lnSpc: parseLnSpc(pPrNode['a:lnSpc'] as XmlNode | undefined),
    bullet: parseBullet(pPrNode),       // A1.2
  } : undefined;

  const rArr = toArray(pNode['a:r'] as XmlNode);
  const brArr = toArray(pNode['a:br'] as XmlNode);
  const fldArr = toArray(pNode['a:fld'] as XmlNode);

  const runs: RawTextRun[] = [];
  const needsOrdering = rArr.length > 0 && (brArr.length > 0 || fldArr.length > 0);

  if (needsOrdering) {
    // 只 rebuild 对 runs 顺序有意义的子节点; 还原 child 出现顺序
    const xml = _txBuilder.build({ 'a:p': {
      'a:r': pNode['a:r'],
      'a:br': pNode['a:br'],
      'a:fld': pNode['a:fld'],
    } });
    const ordered = _txOrderedParser.parse(xml) as Array<Record<string, unknown>>;
    const pChildren = (ordered[0]?.['a:p'] as Array<Record<string, unknown>>) ?? [];
    let rIdx = 0;
    for (const child of pChildren) {
      const key = Object.keys(child).find((k) => k === 'a:r' || k === 'a:br' || k === 'a:fld');
      if (!key) continue;
      if (key === 'a:r') {
        const r = rArr[rIdx++];
        if (r != null) runs.push(parseRun(r as XmlNode));
      } else if (key === 'a:br') {
        runs.push({ text: '\n' });
      } else {
        runs.push({ text: '[字段]' });
      }
    }
  } else {
    for (const r of rArr) runs.push(parseRun(r as XmlNode));
    for (const _ of brArr) runs.push({ text: '\n' });
    for (const _ of fldArr) runs.push({ text: '[字段]' });
  }

  return { pPr, runs };
}

function parseLnSpc(node: XmlNode | undefined): { pct?: number; pts?: number } | undefined {
  if (!node) return undefined;
  const spcPct = node['a:spcPct'] as XmlNode | undefined;
  const spcPts = node['a:spcPts'] as XmlNode | undefined;
  return {
    pct: spcPct ? emuNum(attr(spcPct, 'val')) : undefined,
    pts: spcPts ? emuNum(attr(spcPts, 'val')) : undefined,
  };
}

function parseRun(rNode: XmlNode): RawTextRun {
  const rPrNode = rNode['a:rPr'] as XmlNode | undefined;
  const tNode = rNode['a:t'];
  const text = typeof tNode === 'string' ? tNode : (tNode as XmlNode)?.['#text'] as string ?? '';

  if (!rPrNode) return { text };

  const solid = rPrNode['a:solidFill'] as XmlNode | undefined;
  const latinNode = rPrNode['a:latin'] as XmlNode | undefined;
  const eaNode = rPrNode['a:ea'] as XmlNode | undefined;
  const csNode = rPrNode['a:cs'] as XmlNode | undefined;
  const symNode = rPrNode['a:sym'] as XmlNode | undefined;
  return {
    rPr: {
      sz: emuNum(attr(rPrNode, 'sz')),
      b: attr(rPrNode, 'b') === '1',
      i: attr(rPrNode, 'i') === '1',
      u: attr(rPrNode, 'u'),
      color: solid ? parseColor(solid) : undefined,
      latin: attr(latinNode, 'typeface'),
      ea: attr(eaNode, 'typeface'),
      cs: attr(csNode, 'typeface'),               // A1.3
      sym: attr(symNode, 'typeface'),             // A1.3
      strike: attr(rPrNode, 'strike'),            // A1.3
      baseline: emuNum(attr(rPrNode, 'baseline')),// A1.3
    },
    text,
  };
}

// A1.2: object-path bullet 解析 (a:buAutoNum / a:buChar / a:buNone / a:buFont)
function parseBullet(pPrNode: XmlNode): NonNullable<RawParagraph['pPr']>['bullet'] | undefined {
  const auto = pPrNode['a:buAutoNum'] as XmlNode | undefined;
  const char = pPrNode['a:buChar'] as XmlNode | undefined;
  const none = pPrNode['a:buNone'] !== undefined;
  const font = pPrNode['a:buFont'] as XmlNode | undefined;
  if (!auto && !char && !none && !font) return undefined;
  return {
    auto: auto ? {
      type: attr(auto, 'type') ?? 'arabicPeriod',
      startAt: emuNum(attr(auto, 'startAt')),
    } : undefined,
    char: char ? attr(char, 'char') : undefined,
    none: none ? true : undefined,
    font: font ? attr(font, 'typeface') : undefined,
  };
}

// A1.2: preserveOrder-path bullet 解析 — pPr 子节点是数组 [{ 'a:buAutoNum': [], ':@': { @_type, @_startAt } }, ...]
function parseBulletOrdered(pPrChildren: Array<Record<string, unknown>>): NonNullable<RawParagraph['pPr']>['bullet'] | undefined {
  const autoNode = pPrChildren.find((c) => 'a:buAutoNum' in c);
  const charNode = pPrChildren.find((c) => 'a:buChar' in c);
  const noneNode = pPrChildren.find((c) => 'a:buNone' in c);
  const fontNode = pPrChildren.find((c) => 'a:buFont' in c);
  if (!autoNode && !charNode && !noneNode && !fontNode) return undefined;
  const autoAttrs = autoNode ? ((autoNode[':@'] as Record<string, unknown>) ?? {}) : {};
  const charAttrs = charNode ? ((charNode[':@'] as Record<string, unknown>) ?? {}) : {};
  const fontAttrs = fontNode ? ((fontNode[':@'] as Record<string, unknown>) ?? {}) : {};
  return {
    auto: autoNode ? {
      type: strOrUndef(autoAttrs['@_type']) ?? 'arabicPeriod',
      startAt: emuNum(strOrUndef(autoAttrs['@_startAt'])),
    } : undefined,
    char: charNode ? strOrUndef(charAttrs['@_char']) : undefined,
    none: noneNode ? true : undefined,
    font: fontNode ? strOrUndef(fontAttrs['@_typeface']) : undefined,
  };
}

function parseColorModifiers(colorNode: XmlNode): Array<{ name: string; val: number }> {
  const MOD_NAMES = new Set(['lumMod', 'lumOff', 'tint', 'shade', 'alpha', 'satMod', 'satOff', 'hueMod', 'hueOff']);
  const mods: Array<{ name: string; val: number }> = [];
  // B2: 用 Object.entries 保留 XML 节点出现顺序 (fast-xml-parser 默认按 XML 顺序填 keys)
  // applyColorModifiers 顺序敏感 (lumMod * lumOff 非交换), 必须保留 XML 原始 sibling order
  for (const [key, node] of Object.entries(colorNode)) {
    if (!key.startsWith('a:')) continue;
    const name = key.slice(2);  // 去掉 "a:" 前缀
    if (!MOD_NAMES.has(name)) continue;
    // node 可能是单对象或数组(同名多次出现极罕见, 取第一个)
    const n = Array.isArray(node) ? node[0] : node;
    const v = attr(n as XmlNode, 'val');
    if (v !== undefined) {
      const num = parseInt(v, 10);
      if (!isNaN(num)) mods.push({ name, val: num });
    }
  }
  return mods;
}
