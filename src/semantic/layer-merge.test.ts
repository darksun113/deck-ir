// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { mergeLayerDecorations } from './layer-merge';

const mk = (id: string) => ({ kind: 'picture', id } as never);
const tree = (children: unknown[]) => ({ children } as never);

describe('mergeLayerDecorations 标来源层', () => {
  it('每个 child 带 ownerKind/ownerId(master→layout→slide z 序)', () => {
    const out = mergeLayerDecorations(
      tree([mk('m1')]), tree([mk('l1')]), tree([mk('s1')]),
      { showMaster: true, masterId: 'master1', layoutId: 'slideLayout2', slideId: 'slide1' },
    );
    expect(out.map((o) => [o.child.id, o.ownerKind, o.ownerId])).toEqual([
      ['m1', 'master', 'master1'],
      ['l1', 'layout', 'slideLayout2'],
      ['s1', 'slide', 'slide1'],
    ]);
  });

  it('showMaster=false → 只 slide 层', () => {
    const out = mergeLayerDecorations(
      tree([mk('m1')]), tree([mk('l1')]), tree([mk('s1')]),
      { showMaster: false, masterId: 'master1', layoutId: 'slideLayout2', slideId: 'slide1' },
    );
    expect(out.map((o) => o.ownerKind)).toEqual(['slide']);
  });

  it('按 master → layout → slide 顺序合并装饰(z-index = document order)', () => {
    const master = tree([mk('master-sp1')]);
    const layout = tree([mk('layout-sp1')]);
    const slide = tree([mk('slide-sp1')]);
    const merged = mergeLayerDecorations(master, layout, slide, {
      showMaster: true, masterId: 'master1', layoutId: 'layout1', slideId: 'slide1',
    });
    expect(merged.map((o) => o.child.id)).toEqual(['master-sp1', 'layout-sp1', 'slide-sp1']);
  });

  it('showMaster=false 跳过 master + layout 装饰(slide.showMasterSp=false)', () => {
    const master = tree([mk('master-sp1')]);
    const layout = tree([mk('layout-sp1')]);
    const slide = tree([mk('slide-sp1')]);
    const merged = mergeLayerDecorations(master, layout, slide, {
      showMaster: false, masterId: 'master1', layoutId: 'layout1', slideId: 'slide1',
    });
    expect(merged.map((o) => o.child.id)).toEqual(['slide-sp1']);
  });
});
