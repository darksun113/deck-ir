// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RawFill, RawColor } from '../../ir/raw';
import { parseColor } from '../../raw/element-sp';

const _META = {
  decisionId: '#39',
  ruleName: 'gradFill stops + angle 真解析',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.2.4',
    mappingDocLine: 0,
    decisionDoc: 'plan-2A-design § 1.3 C1',
    officialRef: 'ECMA-376 §20.1.8.33 gradFill',
  },
} as const;

type XmlNode = Record<string, unknown>;

/**
 * 解析 a:gradFill 节点 → RawFill (type=gradient + stops + angle)
 */
export function parseGradFill(gradFillNode: XmlNode): RawFill {
  const gsLst = gradFillNode['a:gsLst'] as XmlNode | undefined;
  const lin = gradFillNode['a:lin'] as XmlNode | undefined;
  const stops: Array<{ pos: number; color: RawColor }> = [];

  if (gsLst) {
    const gsArr = gsLst['a:gs'];
    const gsList = Array.isArray(gsArr) ? gsArr : gsArr ? [gsArr] : [];
    for (const gs of gsList) {
      const gsNode = gs as XmlNode;
      const pos = parseInt(String(gsNode['@_pos'] ?? '0'), 10);
      const color = parseColor(gsNode);
      if (color) stops.push({ pos, color });
    }
  }

  const angle = lin ? parseInt(String(lin['@_ang'] ?? '0'), 10) : undefined;
  const scaled = lin?.['@_scaled'] === '1';

  return {
    type: 'gradient',
    gradient: { stops, angle, scaled },
  };
}
