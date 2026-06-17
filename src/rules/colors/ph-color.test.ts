import { describe, it, expect } from 'vitest';
import { replacePhClrInFill } from './ph-color';
import type { RawFill, RawColor } from '../../ir/raw';

describe('replacePhClrInFill (追踪 #16 + #55)', () => {
  it('含 phClr → 用 overrideColor 替换', () => {
    const fill: RawFill = { type: 'solid', color: { type: 'scheme', val: 'phClr' } };
    const override: RawColor = { type: 'scheme', val: 'bg2' };
    expect(replacePhClrInFill(fill, override).color).toEqual(override);
  });

  it('不含 phClr (直接写死 srgbClr) → 忽略 override (追踪 #55)', () => {
    const fill: RawFill = { type: 'solid', color: { type: 'srgb', val: 'FF0000' } };
    const override: RawColor = { type: 'scheme', val: 'bg2' };
    expect(replacePhClrInFill(fill, override).color).toEqual({ type: 'srgb', val: 'FF0000' });
  });

  it('fill 无 color → 原样返回 (不抛错)', () => {
    const fill: RawFill = { type: 'none' };
    const override: RawColor = { type: 'scheme', val: 'bg2' };
    expect(replacePhClrInFill(fill, override)).toBe(fill);
  });

  it('B4: gradient fill stops 含 phClr → 递归替换', () => {
    const fill: RawFill = {
      type: 'gradient',
      gradient: {
        stops: [
          { pos: 0, color: { type: 'scheme', val: 'phClr' } },
          { pos: 100000, color: { type: 'scheme', val: 'phClr', modifiers: [{ name: 'lumMod', val: 50000 }] } },
        ],
      },
    };
    const override: RawColor = { type: 'scheme', val: 'accent1' };
    const replaced = replacePhClrInFill(fill, override);
    expect(replaced.gradient?.stops[0].color.val).toBe('accent1');
    // 第二个 stop 保留 fmtScheme 自带 modifiers
    expect(replaced.gradient?.stops[1].color.val).toBe('accent1');
    expect(replaced.gradient?.stops[1].color.modifiers).toEqual([{ name: 'lumMod', val: 50000 }]);
  });

  it('B4: gradient stop 不含 phClr → 保持原 color', () => {
    const fill: RawFill = {
      type: 'gradient',
      gradient: {
        stops: [
          { pos: 0, color: { type: 'srgb', val: 'FF0000' } },
        ],
      },
    };
    const override: RawColor = { type: 'scheme', val: 'accent1' };
    const replaced = replacePhClrInFill(fill, override);
    expect(replaced.gradient?.stops[0].color.val).toBe('FF0000');
  });
});
