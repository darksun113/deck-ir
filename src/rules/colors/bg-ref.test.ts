import { describe, it, expect } from 'vitest';
import { resolveBgRef } from './bg-ref';
import type { RawTheme } from '../../ir/raw';

const baseTheme: RawTheme = {
  id: 't', filePath: '',
  clrScheme: { dk1: '#000000', lt1: '#FFFFFF', dk2: '#222222', lt2: '#EEEEEE', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
  fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' },
  fmtScheme: {
    fillStyleLst: [],
    lineStyleLst: [],
    bgFillStyleLst: [
      { type: 'solid', color: { type: 'scheme', val: 'phClr' } },
      { type: 'solid', color: { type: 'scheme', val: 'phClr', modifiers: [{ name: 'lumMod', val: 50000 }] } },
      { type: 'gradient', gradient: { stops: [] } },
    ],
  },
};

describe('resolveBgRef (B1)', () => {
  it('idx=1001 → bgFillStyleLst[0] (solid phClr)', () => {
    const fill = resolveBgRef(1001, baseTheme);
    expect(fill?.type).toBe('solid');
    expect(fill?.color?.val).toBe('phClr');
  });

  it('idx=1002 → bgFillStyleLst[1] (含 lumMod)', () => {
    const fill = resolveBgRef(1002, baseTheme);
    expect(fill?.type).toBe('solid');
    expect(fill?.color?.modifiers).toEqual([{ name: 'lumMod', val: 50000 }]);
  });

  it('idx 越界 → null', () => {
    expect(resolveBgRef(2000, baseTheme)).toBeNull();
    expect(resolveBgRef(999, baseTheme)).toBeNull();
  });

  it('fmtScheme 空 → null', () => {
    const emptyTheme = { ...baseTheme, fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } };
    expect(resolveBgRef(1001, emptyTheme)).toBeNull();
  });
});
