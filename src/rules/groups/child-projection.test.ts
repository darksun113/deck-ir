// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { projectChildInGroup } from './child-projection';

describe('projectChildInGroup (追踪 #9+#10)', () => {
  it('1:1 子坐标系 (无缩放投影)', () => {
    const r = projectChildInGroup(
      { off: { x: 100, y: 100 }, ext: { cx: 200, cy: 200 }, chOff: { x: 0, y: 0 }, chExt: { cx: 200, cy: 200 } },
      { off: { x: 50, y: 50 }, ext: { cx: 100, cy: 100 } }
    );
    expect(r).toEqual({ x: 150, y: 150, w: 100, h: 100 });
  });
  it('chExt 2 倍 ext (压缩缩放)', () => {
    const r = projectChildInGroup(
      { off: { x: 0, y: 0 }, ext: { cx: 100, cy: 100 }, chOff: { x: 0, y: 0 }, chExt: { cx: 200, cy: 200 } },
      { off: { x: 100, y: 100 }, ext: { cx: 100, cy: 100 } }
    );
    expect(r).toEqual({ x: 50, y: 50, w: 50, h: 50 });
  });
  it('chExt=0 边界保护(不除零)', () => {
    const r = projectChildInGroup(
      { off: { x: 0, y: 0 }, ext: { cx: 0, cy: 0 }, chOff: { x: 0, y: 0 }, chExt: { cx: 0, cy: 0 } },
      { off: { x: 50, y: 50 }, ext: { cx: 100, cy: 100 } }
    );
    expect(r.x).toBe(0);  // 0/1 * 50 = 0
    expect(Number.isFinite(r.x)).toBe(true);
  });
});
