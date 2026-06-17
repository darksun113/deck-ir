// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RuleLogger } from '../../logger/types';
import type { RawClrMap } from '../../ir/raw';

const META = {
  decisionId: '#5+#20',
  ruleName: 'schemeClr resolve via clrMap → theme.clrScheme',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.2.3 + 第 1 章 1.2.3',
    mappingDocLine: 220,
    decisionDoc: 'undecided-resolved.md #5 / #15 / #20',
    officialRef: 'documentformat.openxml.presentation.colormap',
  },
} as const;

export interface ThemeClrScheme {
  dk1: string; lt1: string; dk2: string; lt2: string;
  accent1: string; accent2: string; accent3: string;
  accent4: string; accent5: string; accent6: string;
  hlink: string; folHlink: string;
}

/**
 * schemeClr val → 最终 hex (经 clrMap 映射 + theme.clrScheme 查表)
 * 追踪 #5: 必读 master 实际 clrMap,禁止硬编码
 * 追踪 #20: ST_ColorSchemeIndex 只含 12 物理槽位
 */
export function resolveSchemeColor(
  val: string,
  clrMap: RawClrMap,
  theme: ThemeClrScheme,
  logger?: RuleLogger,
  ctx?: { slideRef?: string; shapeId?: string }
): string {
  // W6: phClr 占位符 — 出现在 theme.fmtScheme 链路里, Plan 2 接 fillRef 时才有 overrideColor.
  // Plan 1.2 简化处理: 不在 fillRef 上下文里出现的 phClr 一律退化 transparent + warn.
  if (val === 'phClr') {
    logger?.warn({
      decisionId: '#16',
      message: 'phClr 缺 fillRef/bgRef 上下文 — 退化 transparent (Plan 2 接 fillRef 后真替换)',
      context: { element: 'a:schemeClr', ...ctx },
    });
    return 'transparent';
  }
  // 1. bg1/tx1/bg2/tx2 → 通过 clrMap 翻译到物理槽位
  const aliased = (clrMap as unknown as Record<string, string>)[val] ?? val;
  // 2. 查 theme.clrScheme
  const hex = (theme as unknown as Record<string, string>)[aliased] ?? '#000000';
  logger?.apply({
    ...META, context: { element: 'a:schemeClr', ...ctx },
    input: { val, aliased }, output: { hex },
  });
  return hex;
}
