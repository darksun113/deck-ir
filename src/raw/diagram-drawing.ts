// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

// 修2: SmartArt(graphicFrame diagram)缓存绘图渲染。
// OOXML 的 SmartArt 把"已渲染的形状"缓存在 ppt/diagrams/drawingN.xml(dsp:drawing)里。
// 之前 graphicFrame 一律丢成占位 → 目录/章节页的红灰圆角矩形导航全没。
// 这里把缓存绘图的形状解析出来(dsp:sp 结构 == p:sp，只是命名空间)，复用现有 spTree 解析器。
// 链路：graphicFrame.diagramRelId(r:dm) → dataN.xml → dataModelExt relId → drawingN.xml。
import { XMLParser } from 'fast-xml-parser';
import type { RawSlide, RawShape, RawGraphicFrame } from '../ir/raw';
import type { RuleLogger } from '../logger/types';
import { parseSpTreeChildren } from './_shared-csld';
import { parseRels } from './_shared-rels';
import { buildZOrderIndex } from './z-order';
import { buildCustGeomPaths } from './cust-geom-paths';

type XmlNode = Record<string, unknown>;

function spTreeExt(spTree: XmlNode): { cx: number; cy: number } | null {
  const ext = ((spTree['p:grpSpPr'] as XmlNode | undefined)?.['a:xfrm'] as XmlNode | undefined)?.['a:ext'] as XmlNode | undefined;
  if (!ext) return null;
  return { cx: parseInt(String(ext['@_cx'] ?? '0'), 10), cy: parseInt(String(ext['@_cy'] ?? '0'), 10) };
}

export async function resolveDiagramShapes(
  slide: RawSlide,
  slideRelsXml: string,
  readPart: (absPath: string) => Promise<string | null>,
  logger?: RuleLogger,
): Promise<void> {
  const gfs = slide.cSld.spTree.children.filter(
    (c): c is RawGraphicFrame => c.kind === 'graphicFrame' && !!c.diagramRelId,
  );
  if (gfs.length === 0) return;

  const rels = parseRels(slideRelsXml);
  const relTarget = (id: string): string | null => {
    const r = rels.find((x) => x.id === id);
    return r ? r.target.replace(/^\.\./, '/ppt') : null;
  };
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });

  for (const gf of gfs) {
    try {
      const dataPath = relTarget(gf.diagramRelId!);
      const dataXml = dataPath ? await readPart(dataPath) : null;
      if (!dataXml) continue;
      const ext = dataXml.match(/dataModelExt[^>]*relId="(rId\d+)"/);
      const drawingPath = ext ? relTarget(ext[1]) : null;
      const drawingXml = drawingPath ? await readPart(drawingPath) : null;
      if (!drawingXml) continue;

      // dsp:→p: 归一化(dsp:sp/spTree/spPr/txBody/style 全变 p:，内部 a:* 不动)，复用现有解析器
      const norm = drawingXml.replace(/dsp:/g, 'p:');
      const doc = parser.parse(norm) as XmlNode;
      const spTree = (doc['p:drawing'] as XmlNode | undefined)?.['p:spTree'] as XmlNode | undefined;
      if (!spTree) continue;

      const orderIndex = buildZOrderIndex(norm);
      const custGeomPaths = buildCustGeomPaths(norm);
      const children = parseSpTreeChildren(spTree, { mediaRefs: {}, logger, slideRef: slide.id, orderIndex, custGeomPaths });
      const shapes = children.filter((c): c is RawShape => c.kind === 'sp');

      // 偏移/缩放：drawing 坐标空间 → slide 坐标。drawing.spTree.ext ≈ graphicFrame.ext，加 graphicFrame.off。
      const gOff = gf.xfrm?.off ?? { x: 0, y: 0 };
      const gExt = gf.xfrm?.ext;
      const dExt = spTreeExt(spTree);
      const sx = gExt && dExt && dExt.cx ? gExt.cx / dExt.cx : 1;
      const sy = gExt && dExt && dExt.cy ? gExt.cy / dExt.cy : 1;
      for (const sp of shapes) {
        if (sp.xfrm?.off) sp.xfrm.off = { x: gOff.x + sp.xfrm.off.x * sx, y: gOff.y + sp.xfrm.off.y * sy };
        if (sp.xfrm?.ext) sp.xfrm.ext = { cx: sp.xfrm.ext.cx * sx, cy: sp.xfrm.ext.cy * sy };
        // ±90° 旋转烘焙进几何(交换宽高、移中心)→ 框位置正确且文字保持水平
        // (SmartArt 灰底标题框常 rot 90°；若按 CSS rotate 渲染，文字会跟着竖起来)。
        const rot = sp.xfrm?.rot;
        if (sp.xfrm?.off && sp.xfrm?.ext && (rot === 5400000 || rot === 16200000)) {
          const ccx = sp.xfrm.off.x + sp.xfrm.ext.cx / 2;
          const ccy = sp.xfrm.off.y + sp.xfrm.ext.cy / 2;
          const nw = sp.xfrm.ext.cy, nh = sp.xfrm.ext.cx;
          sp.xfrm.off = { x: ccx - nw / 2, y: ccy - nh / 2 };
          sp.xfrm.ext = { cx: nw, cy: nh };
          sp.xfrm.rot = undefined;
        }
        sp.id = `dgm-${gf.id}-${sp.id}`; // 避免与 slide 自身形状 id 撞
      }
      gf.diagramShapes = shapes;
    } catch (e) {
      logger?.warn({ decisionId: '修2', message: `SmartArt 缓存绘图解析失败: ${(e as Error).message}`, context: { element: 'p:graphicFrame', slideRef: slide.id } });
    }
  }
}
