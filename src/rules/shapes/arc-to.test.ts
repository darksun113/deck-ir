import { describe, it, expect } from 'vitest';
import { arcToSvg } from './arc-to';

describe('arcToSvg (追踪 #34)', () => {
  it('起点 (100, 0), wR=hR=100, stAng=0, swAng=90° (5400000) → 终点应在 (100-100, 100) = (0, 100)', () => {
    const r = arcToSvg(100, 0, 100, 100, 0, 5400000);
    expect(r.endPoint.x).toBeCloseTo(0, 2);
    expect(r.endPoint.y).toBeCloseTo(100, 2);
    expect(r.command).toContain('A 100 100 0 0 1');
  });
  it('swAng >= 180° → largeArcFlag=1', () => {
    const r = arcToSvg(100, 0, 100, 100, 0, 12000000);
    expect(r.command).toContain('A 100 100 0 1 1');
  });
});
