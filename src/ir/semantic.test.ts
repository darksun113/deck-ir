// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import type { SemanticIR } from './semantic';

describe('SemanticIR types', () => {
  it('编译期检查: 完整 SemanticIR 可构造', () => {
    const ir: SemanticIR = {
      slideSize: { w: 960, h: 540 },         // px
      slides: [{
        id: 'slide1', layoutId: 'layout1', masterId: 'master1', themeId: 'theme1',
        background: { css: 'background: #FFFFFF;' },
        elements: [{
          kind: 'shape', id: 'sp1', sourceLayer: 'slide',
          bbox: { x: 100, y: 100, w: 200, h: 50 },  // px
          transform: '',
          fill: { css: 'background-color: #4472C4;' },
          outline: { css: 'border: 1px solid #000;' },
          geometry: { type: 'div' },
          text: null,
          phType: 'title',
        }],
        warnings: [],
      }],
    };
    expect(ir.slides[0].elements[0].kind).toBe('shape');
  });
});
