import { describe, it, expect } from 'vitest';
import { applyXfrm } from './xfrm';

describe('applyXfrm (追踪 #8/#52c)', () => {
  it('off + ext → bbox in px', () => {
    const { bbox } = applyXfrm({ off: { x: 914400, y: 685800 }, ext: { cx: 2743200, cy: 1828800 } });
    expect(bbox).toEqual({ x: 96, y: 72, w: 288, h: 192 });
  });
  it('rot=5400000 → "rotate(90deg)"', () => {
    expect(applyXfrm({ off: { x: 0, y: 0 }, ext: { cx: 100, cy: 100 }, rot: 5400000 }).transform).toBe('rotate(90deg)');
  });
  it('flipH + rot 顺序: rotate(...) scaleX(-1)', () => {
    expect(applyXfrm({ off: { x: 0, y: 0 }, ext: { cx: 100, cy: 100 }, rot: 5400000, flipH: true }).transform).toBe('rotate(90deg) scaleX(-1)');
  });
});
