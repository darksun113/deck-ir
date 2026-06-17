// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RawTheme } from '../../ir/raw';

const _META = {
  decisionId: '#48',
  ruleName: 'fontScheme macro (+mn-lt / +mj-lt / +mn-ea / +mj-ea) → theme.fontScheme',
  source: {
    mappingDoc: 'mapping.md 第 0 章 0.5.5.b + 第 6 章 6.3',
    mappingDocLine: 0,
    decisionDoc: 'plan-2B-design § 1.2 A2.5',
    officialRef: 'ECMA-376 §20.1.4.1.16 fontScheme',
  },
} as const;
void _META;

const MACRO_MAP: Record<string, keyof RawTheme['fontScheme']> = {
  '+mn-lt': 'minorLatin',
  '+mj-lt': 'majorLatin',
  '+mn-ea': 'minorEa',
  '+mj-ea': 'majorEa',
};

/**
 * +mn-lt / +mj-lt / +mn-ea / +mj-ea 宏 → 查 theme.fontScheme 对应字段
 * 非宏字符串原样返回
 */
export function resolveFontSchemeMacro(typeface: string, fontScheme: RawTheme['fontScheme']): string {
  const field = MACRO_MAP[typeface];
  if (field) {
    return fontScheme[field] || typeface;
  }
  return typeface;
}
