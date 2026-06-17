// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

const _META_PCT = {
  decisionId: '#3',
  ruleName: 'ST_Percentage 1/1000% (100000 = 100%)',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.1.6 + -1.1.7',
    mappingDocLine: 170,
    decisionDoc: 'undecided-resolved.md #3 + #4',
    officialRef: 'MS Learn PercentageType.Val + python-docx issue #1316',
  },
} as const;

/** alphaModFix.amt / PercentageType.val → 0~1 decimal */
export function ooxmlPercentageToDecimal(val: number): number {
  return val / 100000;
}

/** 同上但返回 0~100 人类百分比 */
export function ooxmlPercentageToHuman(val: number): number {
  return val / 1000;
}
