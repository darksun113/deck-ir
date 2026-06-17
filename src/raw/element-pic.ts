// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RawPicture, RawCustPath } from '../ir/raw';
import { attr, emuNum } from './_shared-csld';
import { parseXfrm } from './element-sp';
import type { RuleLogger } from '../logger/types';

type XmlNode = Record<string, unknown>;

export interface PictureCtx {
  /** slide / layout / master 的 mediaRefs(rId → 路径) */
  mediaRefs: Record<string, string>;
  /** W2/W3: 用于 wiring mc/transition/3D 调 logger 透传 */
  logger?: RuleLogger;
  slideRef?: string;
  /** 2D-A: id → 文档序号, 用于恢复 z-order */
  orderIndex?: Map<string, number>;
  /** 修#2: id → custGeom 有序路径(预解析) */
  custGeomPaths?: Map<string, RawCustPath>;
}

export function parsePicture(picNode: XmlNode, _ctx: PictureCtx): RawPicture {
  const nvPicPr = picNode['p:nvPicPr'] as XmlNode | undefined;
  const cNvPr = nvPicPr?.['p:cNvPr'] as XmlNode | undefined;
  const blipFill = picNode['p:blipFill'] as XmlNode | undefined;
  const blip = blipFill?.['a:blip'] as XmlNode | undefined;
  const srcRect = blipFill?.['a:srcRect'] as XmlNode | undefined;
  const spPr = picNode['p:spPr'] as XmlNode | undefined;

  return {
    kind: 'pic',
    id: attr(cNvPr, 'id') ?? '',
    name: attr(cNvPr, 'name'),
    xfrm: parseXfrm(spPr?.['a:xfrm'] as XmlNode | undefined),
    blipRef: {
      embed: attr(blip, 'r:embed'),
      link: attr(blip, 'r:link'),
    },
    srcRect: srcRect ? {
      l: emuNum(attr(srcRect, 'l')),
      t: emuNum(attr(srcRect, 't')),
      r: emuNum(attr(srcRect, 'r')),
      b: emuNum(attr(srcRect, 'b')),
    } : undefined,
    cNvPr: cNvPr ? {
      descr: attr(cNvPr, 'descr'),
      title: attr(cNvPr, 'title'),
      name: attr(cNvPr, 'name'),
    } : undefined,
  };
}
