// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { emuToPx } from '../units/emu';

const _META = {
  decisionId: '#47',
  ruleName: 'bodyPr Ins defaults (ISO §21.1.2.1.1)',
  source: {
    mappingDoc: 'mapping.md 第 6 章 6.2.1',
    mappingDocLine: 4863,
    decisionDoc: 'undecided-resolved.md #47',
    officialRef: 'ISO/IEC 29500-1 §21.1.2.1.1',
  },
} as const;

const DEFAULT_LINS = 91440;  // EMU = 0.1 inch
const DEFAULT_TINS = 45720;  // EMU = 0.05 inch

export function bodyPrToCss(bodyPr?: { lIns?: number; rIns?: number; tIns?: number; bIns?: number }): string {
  const l = emuToPx(bodyPr?.lIns ?? DEFAULT_LINS);
  const r = emuToPx(bodyPr?.rIns ?? DEFAULT_LINS);
  const t = emuToPx(bodyPr?.tIns ?? DEFAULT_TINS);
  const b = emuToPx(bodyPr?.bIns ?? DEFAULT_TINS);
  return `padding: ${t}px ${r}px ${b}px ${l}px;`;
}
