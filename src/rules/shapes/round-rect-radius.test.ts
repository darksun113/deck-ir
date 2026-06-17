import { describe, it, expect } from 'vitest';
import { roundRectRadiusPx } from './round-rect-radius';

describe('roundRectRadiusPx (追踪 #31)', () => {
  it('默认 val=16667, w=288 h=192 → ~32 px', () => {
    expect(roundRectRadiusPx(288, 192)).toBeCloseTo(32, 0);
  });
  it('自定义 val=50000 (50%), w=200 h=100 → 50 px', () => {
    expect(roundRectRadiusPx(200, 100, 50000)).toBe(50);
  });
});
