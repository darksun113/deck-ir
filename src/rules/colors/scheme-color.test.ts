// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { resolveSchemeColor, type ThemeClrScheme } from './scheme-color';
import type { RawClrMap } from '../../ir/raw';
import { createCollectorLogger } from '../../logger';

const CLR_MAP: RawClrMap = {
  bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2',
  accent1: 'accent1', accent2: 'accent2', accent3: 'accent3',
  accent4: 'accent4', accent5: 'accent5', accent6: 'accent6',
  hlink: 'hlink', folHlink: 'folHlink',
};

const THEME: ThemeClrScheme = {
  dk1: '#000000', lt1: '#FFFFFF', dk2: '#1F497D', lt2: '#EEECE1',
  accent1: '#4F81BD', accent2: '#C0504D', accent3: '#9BBB59',
  accent4: '#8064A2', accent5: '#4BACC6', accent6: '#F79646',
  hlink: '#0000FF', folHlink: '#800080',
};

describe('resolveSchemeColor (追踪 #5+#15+#20)', () => {
  it('bg1 → 通过 clrMap → lt1 → theme.lt1 = #FFFFFF', () => {
    expect(resolveSchemeColor('bg1', CLR_MAP, THEME)).toBe('#FFFFFF');
  });
  it('accent1 → 物理槽位直接查表 = #4F81BD', () => {
    expect(resolveSchemeColor('accent1', CLR_MAP, THEME)).toBe('#4F81BD');
  });
  it('dk1 物理槽位 = #000000', () => {
    expect(resolveSchemeColor('dk1', CLR_MAP, THEME)).toBe('#000000');
  });
  it('未知 val fallback #000000', () => {
    expect(resolveSchemeColor('unknown', CLR_MAP, THEME)).toBe('#000000');
  });
});

describe('resolveSchemeColor W6 phClr 防黑色降级', () => {
  it('W6: val=phClr → 返回 transparent + collector warn', () => {
    const collector = createCollectorLogger();
    const result = resolveSchemeColor('phClr', CLR_MAP, THEME, collector);
    expect(result).toBe('transparent');
    const warns = collector.toStrings();
    expect(warns.some(w => w.includes('phClr'))).toBe(true);
  });

  it('W6: val=accent1 → 正常返回 #4F81BD (不影响其他 schemeClr)', () => {
    const result = resolveSchemeColor('accent1', CLR_MAP, THEME);
    expect(result).toBe('#4F81BD');
  });
});
