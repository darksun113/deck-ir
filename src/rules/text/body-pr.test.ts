// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { bodyPrToCss } from './body-pr';

describe('bodyPrToCss (追踪 #47)', () => {
  it('默认值 91440/45720 EMU → 9.6px / 4.8px padding', () => {
    expect(bodyPrToCss()).toBe('padding: 4.8px 9.6px 4.8px 9.6px;');
  });

  it('A2.1: bodyPr 完整 6 字段都能正确生成 padding (Plan 2B wire 验证)', () => {
    const result = bodyPrToCss({ lIns: 91440, rIns: 91440, tIns: 45720, bIns: 45720 });
    // 91440 EMU / 9525 EMU/px = 9.6 px, 45720 / 9525 = 4.8 px
    expect(result).toContain('padding:');
    expect(result).toMatch(/4\.8px/);
    expect(result).toMatch(/9\.6px/);
  });
});
