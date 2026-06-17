// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { parsePresentation } from './presentation';

describe('parsePresentation', () => {
  it('16:9 模板: cx=12192000 cy=6858000', () => {
    const xml = `<p:presentation xmlns:p="x"><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/></p:presentation>`;
    const result = parsePresentation(xml);
    expect(result.slideSize.cx_emu).toBe(12192000);
    expect(result.slideSize.cy_emu).toBe(6858000);
  });

  it('4:3 模板: cx=9144000 cy=6858000', () => {
    const xml = `<p:presentation xmlns:p="x"><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`;
    const result = parsePresentation(xml);
    expect(result.slideSize.cx_emu).toBe(9144000);
    expect(result.slideSize.cy_emu).toBe(6858000);
  });

  it('缺失 sldSz: 回退默认 16:9', () => {
    const xml = `<p:presentation xmlns:p="x"/>`;
    const result = parsePresentation(xml);
    expect(result.slideSize.cx_emu).toBe(12192000);
    expect(result.slideSize.cy_emu).toBe(6858000);
  });
});
