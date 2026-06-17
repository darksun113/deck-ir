// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { algnToCss, paragraphPropsToCss } from './paragraph';

describe('algnToCss (追踪 #49 Gemini 精确组合)', () => {
  it('dist (中文分散对齐) 必须含 text-align-last: justify', () => {
    expect(algnToCss('dist')).toBe('text-align: justify; text-align-last: justify;');
  });
  it('thaiDist → 含 text-justify: inter-character', () => {
    expect(algnToCss('thaiDist')).toContain('text-justify: inter-character');
  });
});

describe('paragraphPropsToCss (A2.2)', () => {
  it('marL=914400 (1 inch) → margin-left: 96px', () => {
    const css = paragraphPropsToCss({ marL: 914400 });
    expect(css).toContain('margin-left: 96px');
  });

  it('indent=914400 → text-indent: 96px', () => {
    const css = paragraphPropsToCss({ indent: 914400 });
    expect(css).toContain('text-indent: 96px');
  });

  it('lnSpc.pct=150000 (150%) → line-height: 1.5', () => {
    const css = paragraphPropsToCss({ lnSpc: { pct: 150000 } });
    expect(css).toContain('line-height: 1.5');
  });

  it('lnSpc.pts=2000 (20pt) → line-height: 20pt', () => {
    const css = paragraphPropsToCss({ lnSpc: { pts: 2000 } });
    expect(css).toContain('line-height: 20pt');
  });

  it('全空 → 空字符串', () => {
    expect(paragraphPropsToCss({})).toBe('');
  });
});
