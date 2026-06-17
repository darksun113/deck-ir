// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { resolvePresetColor, PRST_COLOR_TABLE } from './preset-color';

describe('prstClr 149 项 (追踪 #6)', () => {
  it('common: red/blue/black/white/yellow', () => {
    expect(resolvePresetColor('red')).toBe('#FF0000');
    expect(resolvePresetColor('blue')).toBe('#0000FF');
    expect(resolvePresetColor('black')).toBe('#000000');
    expect(resolvePresetColor('white')).toBe('#FFFFFF');
    expect(resolvePresetColor('yellow')).toBe('#FFFF00');
  });
  it('未知 fallback #000000', () => {
    expect(resolvePresetColor('foobar')).toBe('#000000');
  });
  it('T11: 补全的 149 项 — orange/violet/turquoise/silver/teal', () => {
    expect(resolvePresetColor('orange')).toBe('#FFA500');
    expect(resolvePresetColor('violet')).toBe('#EE82EE');
    expect(resolvePresetColor('turquoise')).toBe('#40E0D0');
    expect(resolvePresetColor('silver')).toBe('#C0C0C0');
    expect(resolvePresetColor('teal')).toBe('#008080');
  });
  it('T11: 别名 medAquamarine === mediumAquamarine', () => {
    expect(resolvePresetColor('medAquamarine')).toBe(resolvePresetColor('mediumAquamarine'));
  });
  it('T11: 表大小 >= 149 项 (OOXML 标准 + alias)', () => {
    expect(Object.keys(PRST_COLOR_TABLE).length).toBeGreaterThanOrEqual(149);
  });
});
