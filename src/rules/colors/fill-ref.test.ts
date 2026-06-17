// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { resolveFillRef } from './fill-ref';
import type { RawTheme } from '../../ir/raw';

const theme: RawTheme = {
  id: 't', filePath: '',
  clrScheme: { dk1: '#000000', lt1: '#FFFFFF', dk2: '#222222', lt2: '#EEEEEE', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
  fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' },
  fmtScheme: {
    fillStyleLst: [
      { type: 'solid', color: { type: 'scheme', val: 'phClr' } },
      { type: 'gradient', gradient: { stops: [] } },
      { type: 'solid', color: { type: 'scheme', val: 'phClr', modifiers: [{ name: 'lumMod', val: 50000 }] } },
    ],
    lineStyleLst: [],
    bgFillStyleLst: [],
  },
};

describe('resolveFillRef (B2)', () => {
  it('idx=1 → fillStyleLst[0]', () => {
    const fill = resolveFillRef(1, theme);
    expect(fill?.type).toBe('solid');
    expect(fill?.color?.val).toBe('phClr');
  });

  it('idx=3 → fillStyleLst[2] (含 lumMod)', () => {
    const fill = resolveFillRef(3, theme);
    expect(fill?.color?.modifiers).toEqual([{ name: 'lumMod', val: 50000 }]);
  });

  it('idx 越界 → null', () => {
    expect(resolveFillRef(0, theme)).toBeNull();
    expect(resolveFillRef(100, theme)).toBeNull();
  });
});
