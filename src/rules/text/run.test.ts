// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { runToCss } from './run';
import type { RawTheme, RawClrMap } from '../../ir/raw';

const theme: RawTheme = {
  id: 't', filePath: '',
  clrScheme: { dk1: '#000000', lt1: '#FFFFFF', dk2: '#222222', lt2: '#EEEEEE', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
  fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '微软雅黑', minorEa: '宋体' },
  fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] },
};
const clrMap: RawClrMap = {
  bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2',
  accent1: 'accent1', accent2: 'accent2', accent3: 'accent3', accent4: 'accent4', accent5: 'accent5', accent6: 'accent6', hlink: 'hlink', folHlink: 'folHlink',
};

describe('runToCss (A2.3)', () => {
  it('sz=2400 → font-size: 24pt (sz 单位 1/100 pt)', () => {
    const css = runToCss({ sz: 2400 }, theme, clrMap);
    expect(css).toContain('font-size: 24pt');
  });

  it('b=true → font-weight: bold', () => {
    const css = runToCss({ b: true }, theme, clrMap);
    expect(css).toContain('font-weight: bold');
  });

  it('i=true → font-style: italic', () => {
    const css = runToCss({ i: true }, theme, clrMap);
    expect(css).toContain('font-style: italic');
  });

  it('u="sng" → text-decoration: underline', () => {
    const css = runToCss({ u: 'sng' }, theme, clrMap);
    expect(css).toContain('text-decoration: underline');
  });

  it('strike="sngStrike" → text-decoration: line-through', () => {
    const css = runToCss({ strike: 'sngStrike' }, theme, clrMap);
    expect(css).toContain('line-through');
  });

  it('color srgb FF0000 → color: #FF0000', () => {
    const css = runToCss({ color: { type: 'srgb', val: 'FF0000' } }, theme, clrMap);
    expect(css).toContain('color: #FF0000');
  });

  it('color schemeClr accent1 → color: #4472C4', () => {
    const css = runToCss({ color: { type: 'scheme', val: 'accent1' } }, theme, clrMap);
    expect(css).toContain('color: #4472C4');
  });

  it('latin Calibri + ea 微软雅黑 → font-family CJK 优先', () => {
    const css = runToCss({ latin: 'Calibri', ea: '微软雅黑' }, theme, clrMap);
    expect(css).toMatch(/font-family:\s*['"]微软雅黑['"],\s*['"]Calibri['"]/);
  });

  it('+mn-lt 宏 → resolveFontSchemeMacro → minorLatin', () => {
    const css = runToCss({ latin: '+mn-lt' }, theme, clrMap);
    expect(css).toMatch(/font-family:[^;]*Calibri/);
  });

  it('baseline=30000 → vertical-align: super (正值上标)', () => {
    const css = runToCss({ baseline: 30000 }, theme, clrMap);
    expect(css).toContain('vertical-align: super');
  });

  it('全空 → 空字符串', () => {
    const css = runToCss({}, theme, clrMap);
    expect(css).toBe('');
  });
});
