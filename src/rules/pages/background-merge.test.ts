// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { mergeSlideBackground } from './background-merge';
import type { RawBackground, RawClrMap, RawTheme } from '../../ir/raw';

const theme: RawTheme = {
  id: 't', filePath: '',
  clrScheme: { dk1: '#000000', lt1: '#FFFFFF', dk2: '#222222', lt2: '#EEEEEE', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
  fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' },
  fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] },
};
const clrMap: RawClrMap = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2', accent1: 'accent1', accent2: 'accent2', accent3: 'accent3', accent4: 'accent4', accent5: 'accent5', accent6: 'accent6', hlink: 'hlink', folHlink: 'folHlink' };

describe('mergeSlideBackground (P0 #3)', () => {
  it('slide.bg 优先 (覆盖 layout/master)', () => {
    const slideBg: RawBackground = { bgPr: { fill: { type: 'solid', color: { type: 'srgb', val: 'FF0000' } } } };
    const layoutBg: RawBackground = { bgPr: { fill: { type: 'solid', color: { type: 'srgb', val: '00FF00' } } } };
    const masterBg: RawBackground = { bgPr: { fill: { type: 'solid', color: { type: 'srgb', val: '0000FF' } } } };
    const result = mergeSlideBackground({ master: masterBg, layout: layoutBg, slide: slideBg, theme, clrMap });
    expect(result.css).toContain('#FF0000');
  });

  it('slide.bg 缺失 → 回退 layout.bg', () => {
    const layoutBg: RawBackground = { bgPr: { fill: { type: 'solid', color: { type: 'srgb', val: '00FF00' } } } };
    const masterBg: RawBackground = { bgPr: { fill: { type: 'solid', color: { type: 'srgb', val: '0000FF' } } } };
    const result = mergeSlideBackground({ master: masterBg, layout: layoutBg, slide: null, theme, clrMap });
    expect(result.css).toContain('#00FF00');
  });

  it('全空 → fallback #FFFFFF', () => {
    const result = mergeSlideBackground({ master: null, layout: null, slide: null, theme, clrMap });
    expect(result.css).toContain('#FFFFFF');
  });

  it('schemeClr bg2 → 解到 theme.clrScheme.lt2 = #EEEEEE', () => {
    const slideBg: RawBackground = { bgPr: { fill: { type: 'solid', color: { type: 'scheme', val: 'bg2' } } } };
    const result = mergeSlideBackground({ master: null, layout: null, slide: slideBg, theme, clrMap });
    expect(result.css).toContain('#EEEEEE');
  });

  it('gradFill 简化: 退化为线性渐变 CSS', () => {
    const slideBg: RawBackground = { bgPr: { fill: { type: 'gradient', gradient: { stops: [{ pos: 0, color: { type: 'srgb', val: 'FF0000' } }, { pos: 100000, color: { type: 'srgb', val: '00FF00' } }] } } } };
    const result = mergeSlideBackground({ master: null, layout: null, slide: slideBg, theme, clrMap });
    expect(result.css).toContain('linear-gradient');
  });

  it('blipFill: warn + 退化 transparent', () => {
    const slideBg: RawBackground = { bgPr: { fill: { type: 'blip', blipRef: { embed: 'rId7' } } } };
    const warns: string[] = [];
    const logger = { apply: () => {}, warn: (e: { message: string }) => warns.push(e.message), error: () => {} };
    const result = mergeSlideBackground({ master: null, layout: null, slide: slideBg, theme, clrMap }, logger);
    expect(result.css).toContain('transparent');
    expect(warns.some(w => w.includes('blipFill'))).toBe(true);
  });

  it('B3: schemeClr + lumMod → CSS 经 applyColorModifiers 变暗', () => {
    const slideBg: RawBackground = {
      bgPr: {
        fill: {
          type: 'solid',
          color: { type: 'scheme', val: 'accent1', modifiers: [{ name: 'lumMod', val: 60000 }] },
        },
      },
    };
    const result = mergeSlideBackground({ master: null, layout: null, slide: slideBg, theme, clrMap });
    // theme.clrScheme.accent1 = '#4472C4'
    // lumMod 60% 把亮度乘 0.6 → 颜色变暗
    // 期望结果不再是裸 '#4472C4'
    expect(result.css).not.toContain('#4472C4');
    expect(result.css).toMatch(/#[0-9A-F]{6}/i);
  });

  it('B1: bgRef idx=1001 → 解 fmtScheme.bgFillStyleLst[0] + phClr 替换', () => {
    const themeWithFmt: RawTheme = {
      ...theme,
      fmtScheme: {
        ...theme.fmtScheme,
        bgFillStyleLst: [
          { type: 'solid', color: { type: 'scheme', val: 'phClr' } },
        ],
      },
    };
    const slideBg: RawBackground = {
      bgRef: { idx: 1001, color: { type: 'scheme', val: 'accent2' } },  // override phClr -> accent2
    };
    const result = mergeSlideBackground({ master: null, layout: null, slide: slideBg, theme: themeWithFmt, clrMap });
    // phClr -> accent2 -> #ED7D31
    expect(result.css).toContain('#ED7D31');
  });

  it('B1: bgRef idx 越界 → warn + 退化 #FFFFFF', () => {
    const warns: string[] = [];
    const logger = { apply: () => {}, warn: (e: { message: string }) => warns.push(e.message), error: () => {} };
    const slideBg: RawBackground = { bgRef: { idx: 2000, color: undefined } };
    const result = mergeSlideBackground({ master: null, layout: null, slide: slideBg, theme, clrMap }, logger);
    expect(result.css).toContain('#FFFFFF');
    expect(warns.some(w => w.includes('idx'))).toBe(true);
  });
});
