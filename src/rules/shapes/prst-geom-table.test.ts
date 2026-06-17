// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { resolvePrstGeom, isMvpPrst } from './prst-geom-table';

describe('resolvePrstGeom MVP 7 个 (追踪 #33)', () => {
  it('rect → type=div', () => {
    expect(resolvePrstGeom('rect', { w: 100, h: 50 }).geometry).toEqual({ type: 'div' });
  });
  it('roundRect 默认 val=16667 → cssRadius 含 px', () => {
    const r = resolvePrstGeom('roundRect', { w: 200, h: 100 }).geometry;
    expect(r.type).toBe('div');
    expect((r as any).cssRadius).toMatch(/border-radius: \d+(\.\d+)?px;/);
  });
  it('ellipse → border-radius: 50%', () => {
    expect((resolvePrstGeom('ellipse', { w: 100, h: 100 }).geometry as any).cssRadius).toBe('border-radius: 50%;');
  });
  it('triangle → svg-path', () => {
    const r = resolvePrstGeom('triangle', { w: 100, h: 100 }).geometry;
    expect(r.type).toBe('svg-path');
  });
  it('未支持 prst (如 star5) → fallback + warning', () => {
    const r = resolvePrstGeom('star5', { w: 100, h: 100 });
    expect(r.warning).toContain('未实现');
  });
  it('isMvpPrst 识别 7 个 MVP', () => {
    expect(isMvpPrst('rect')).toBe(true);
    expect(isMvpPrst('star5')).toBe(false);
  });
});
