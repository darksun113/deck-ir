// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { resolveLineRef } from './line-ref';
import type { RawTheme } from '../../ir/raw';

const theme: RawTheme = {
  id: 't', filePath: '',
  clrScheme: { dk1: '#000000', lt1: '#FFFFFF', dk2: '#222222', lt2: '#EEEEEE', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
  fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' },
  fmtScheme: {
    fillStyleLst: [],
    lineStyleLst: [
      { width: 6350, color: { type: 'scheme', val: 'phClr' } },
      { width: 12700, color: { type: 'scheme', val: 'phClr' } },
    ],
    bgFillStyleLst: [],
  },
};

describe('resolveLineRef (B3)', () => {
  it('idx=1 → lineStyleLst[0] (width 6350)', () => {
    const line = resolveLineRef(1, theme);
    expect(line?.width).toBe(6350);
  });

  it('idx 越界 → null', () => {
    expect(resolveLineRef(10, theme)).toBeNull();
  });
});
