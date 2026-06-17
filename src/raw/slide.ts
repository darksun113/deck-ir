// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { XMLParser } from 'fast-xml-parser';
import type { RawSlide } from '../ir/raw';
import type { RuleLogger } from '../logger/types';
import { parseCSld } from './_shared-csld';
import { parseRels } from './_shared-rels';
import { skipTransition } from '../rules/unsupported/transition';
import { buildZOrderIndex } from './z-order';
import { buildCustGeomPaths } from './cust-geom-paths';

export function parseSlide(
  id: string,
  filePath: string,
  xml: string,
  relsXml: string,
  logger?: RuleLogger,
): RawSlide {
  // A1.1: stopNodes 让 p:txBody 进 element-sp 时是原始 inner XML 字符串, 保留 a:r/a:br/a:fld 真实交错顺序
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
  const doc = parser.parse(xml);
  const sld = doc['p:sld'];

  // show: 默认 true (追踪 #21)
  const rawShow = sld['@_show'];
  const show = rawShow === undefined ? true : (rawShow === '1' || rawShow === 'true');

  // showMasterSp: 默认 null (追踪 #22 覆盖优先)
  const rawSms = sld['@_showMasterSp'];
  const showMasterSp = rawSms === undefined ? null : (rawSms === '1' || rawSms === 'true');

  // layoutRef + mediaRefs (从 rels)
  const rels = parseRels(relsXml);
  const layoutRel = rels.find((r) => r.type.endsWith('/slideLayout'));
  if (!layoutRel) throw new Error(`slide ${id} 无 slideLayout rels`);
  const layoutNum = layoutRel.target.match(/slideLayout(\d+)\.xml$/)?.[1] ?? '1';

  // mediaRefs (找 image 类型 rels) — 必须在 parseCSld 之前算好, parsePicture 要用
  const mediaRefs: Record<string, string> = {};
  for (const r of rels) {
    if (r.type.endsWith('/image')) {
      mediaRefs[r.id] = r.target.replace(/^\.\./, '/ppt');
    }
  }

  // cSld 用 mediaRefs 作 PictureCtx; orderIndex 恢复文档序 z-order (2D-A)
  const orderIndex = buildZOrderIndex(xml);
  const custGeomPaths = buildCustGeomPaths(xml);
  const cSld = parseCSld(sld['p:cSld'], { mediaRefs, logger, slideRef: id, orderIndex, custGeomPaths });

  // W3: skipTransition wire
  if (sld['p:transition']) {
    skipTransition(logger, { slideRef: id });
  }

  return {
    id, filePath, cSld,
    layoutRef: `layout${layoutNum}`,
    show, showMasterSp, mediaRefs,
  };
}
