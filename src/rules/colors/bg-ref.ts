// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RawFill, RawTheme } from '../../ir/raw';

const _META = {
  decisionId: '#19',
  ruleName: 'bgRef idx → fmtScheme.bgFillStyleLst',
  source: {
    mappingDoc: 'mapping.md 第 1 章 1.6.4',
    mappingDocLine: 0,
    decisionDoc: 'plan-2A-design § 1.2 B1',
    officialRef: 'ECMA-376 §20.1.4.1.7 bgRef',
  },
} as const;
void _META;

/**
 * bgRef idx 1001/1002/1003 → fmtScheme.bgFillStyleLst[0/1/2]
 * OOXML bgRef idx 是 1001-based, 减 1001 拿到 0-based 数组下标
 * 返回 null 表示 idx 越界或 fmtScheme 为空
 */
export function resolveBgRef(idx: number, theme: RawTheme): RawFill | null {
  const arrIdx = idx - 1001;
  const list = theme.fmtScheme.bgFillStyleLst;
  if (arrIdx < 0 || arrIdx >= list.length) return null;
  return list[arrIdx];
}
