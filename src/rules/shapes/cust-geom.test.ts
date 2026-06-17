import { describe, it, expect } from 'vitest';
import { custGeomToSvgPath } from './cust-geom';

describe('custGeomToSvgPath', () => {
  it('moveTo + lnTo + close → SVG d', () => {
    const r = custGeomToSvgPath({
      w: 100, h: 100,
      commands: [
        { type: 'moveTo', x: 0, y: 0 },
        { type: 'lnTo', x: 100, y: 0 },
        { type: 'lnTo', x: 50, y: 100 },
        { type: 'close' },
      ],
    });
    expect(r.d).toBe('M 0 0 L 100 0 L 50 100 Z');
    expect(r.viewBox).toBe('0 0 100 100');
  });
  it('cubicBezTo', () => {
    const r = custGeomToSvgPath({
      w: 100, h: 100,
      commands: [
        { type: 'moveTo', x: 0, y: 0 },
        { type: 'cubicBezTo', pts: [{ x: 20, y: 20 }, { x: 80, y: 80 }, { x: 100, y: 100 }] },
      ],
    });
    expect(r.d).toBe('M 0 0 C 20 20 80 80 100 100');
  });
});
