// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { ooxmlAngleToDeg } from './angle';

describe('ST_Angle conversion (追踪 #2)', () => {
  it('rot=5400000 = 90°(实测,排除 Microsoft typo 1/64000)', () => {
    expect(ooxmlAngleToDeg(5400000)).toBe(90);
  });
  it('rot=10800000 = 180°', () => {
    expect(ooxmlAngleToDeg(10800000)).toBe(180);
  });
});
