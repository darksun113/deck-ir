// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { ooxmlPercentageToDecimal } from '../units/percentage';

const _META = {
  decisionId: '#31',
  ruleName: 'roundRect avLst val → border-radius px',
  source: {
    mappingDoc: 'mapping.md 第 2 章 2.4.1.b',
    mappingDocLine: 2573,
    decisionDoc: 'undecided-resolved.md #31',
    officialRef: 'ECMA-376 §20.1.10.55 Geometry Guides',
  },
} as const;

const DEFAULT_VAL = 16667;

/** roundRect 圆角: 必须算成 px (CSS % 对长方形会变椭圆角) */
export function roundRectRadiusPx(w: number, h: number, avLstVal?: number): number {
  const val = avLstVal ?? DEFAULT_VAL;
  return ooxmlPercentageToDecimal(val) * Math.min(w, h);
}
