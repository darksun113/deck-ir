// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { skipTransition } from './transition';
import { skip3DEffects } from './three-d';
import { reuseInkAsShape } from './ink';

describe('unsupported elements (追踪 #57 / #58 / #59)', () => {
  it('skipTransition → warn', () => {
    let m = '';
    skipTransition({ apply: () => {}, warn: (e) => { m = e.message; }, error: () => {} });
    expect(m).toContain('永久不支持');
  });
  it('skip3DEffects → warn', () => {
    let m = '';
    skip3DEffects({ apply: () => {}, warn: (e) => { m = e.message; }, error: () => {} });
    expect(m).toContain('skip');
  });
  it('reuseInkAsShape → apply (不抛错)', () => {
    expect(() => reuseInkAsShape()).not.toThrow();
  });
});
