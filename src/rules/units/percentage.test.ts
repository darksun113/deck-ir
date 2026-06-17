// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { ooxmlPercentageToDecimal, ooxmlPercentageToHuman } from './percentage';

describe('ST_Percentage conversion (追踪 #3 + #4)', () => {
  it('val=100000 = 100% = 1.0 decimal', () => {
    expect(ooxmlPercentageToDecimal(100000)).toBe(1);
    expect(ooxmlPercentageToHuman(100000)).toBe(100);
  });
  it('amt=70000 = 70% = 0.7 (python-docx issue #1316 例子)', () => {
    expect(ooxmlPercentageToDecimal(70000)).toBe(0.7);
  });
  it('val=16667 ≈ 16.667% (roundRect 默认 PowerPoint 圆角)', () => {
    expect(ooxmlPercentageToHuman(16667)).toBeCloseTo(16.667, 3);
  });
});
