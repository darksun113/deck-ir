// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { transformToSemanticIR } from './transform';
import { createNoopLogger } from '../logger/noop';
import type { RawIR } from '../ir/raw';

describe('transformToSemanticIR 集成', () => {
  it('1 slide + 1 sp(rect 填充) → SemanticIR 含 1 slide + 1 element', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },  // T2: 4:3 默认
      masters: [{ id: 'master1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        clrMap: { bg1: 'lt1' } as any, themeRef: 'theme1', showMasterSp: true, mediaRefs: {} }],
      themes: [{ id: 'theme1', filePath: '', clrScheme: {} as any, fontScheme: {} as any, fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } }],
      layouts: [{ id: 'layout1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        masterRef: 'master1', clrMapOvr: null, showMasterSp: null, mediaRefs: {} }],
      slides: [{ id: 'slide1', filePath: '',
        cSld: { bg: null, spTree: { children: [{
          kind: 'sp', id: 'sp1',
          xfrm: { off: { x: 0, y: 0 }, ext: { cx: 952500, cy: 476250 } },
          geom: { prst: 'rect' },
          fill: { type: 'solid', color: { type: 'srgb', val: '4472C4' } },
        }] } },
        layoutRef: 'layout1', show: true, showMasterSp: null, mediaRefs: {} }],
      relsGraph: { slide1: { layout: 'layout1', media: {} } },
      mediaAssets: [],   // T4
    };
    const semantic = transformToSemanticIR(ir, createNoopLogger());
    expect(semantic.slides).toHaveLength(1);
    expect(semantic.slides[0].elements).toHaveLength(1);
    expect(semantic.slides[0].elements[0].kind).toBe('shape');
    expect((semantic.slides[0].elements[0] as any).fill.css).toBe('background-color: #4472C4;');
  });

  it('T7: grpSp 内的 sp 子元素 flatten 到 slide.elements 顶层', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },
      masters: [{ id: 'master1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        clrMap: { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2', accent1: 'accent1', accent2: 'accent2', accent3: 'accent3', accent4: 'accent4', accent5: 'accent5', accent6: 'accent6', hlink: 'hlink', folHlink: 'folHlink' }, themeRef: 'theme1', showMasterSp: true, mediaRefs: {} }],
      themes: [{ id: 'theme1', filePath: '', clrScheme: { dk1: '#000', lt1: '#fff', dk2: '#222', lt2: '#eee', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' }, fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' }, fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } }],
      layouts: [{ id: 'layout1', filePath: '', cSld: { bg: null, spTree: { children: [] } }, masterRef: 'master1', clrMapOvr: null, showMasterSp: null, mediaRefs: {} }],
      slides: [{ id: 'slide1', filePath: '',
        cSld: { bg: null, spTree: { children: [{
          kind: 'grpSp', id: 'grp1',
          xfrm: { off: { x: 0, y: 0 }, ext: { cx: 200, cy: 200 }, chOff: { x: 0, y: 0 }, chExt: { cx: 200, cy: 200 } },
          children: [
            { kind: 'sp', id: 'spA', xfrm: { off: { x: 50, y: 50 }, ext: { cx: 100, cy: 100 } }, geom: { prst: 'rect' } },
            { kind: 'sp', id: 'spB', xfrm: { off: { x: 100, y: 100 }, ext: { cx: 50, cy: 50 } }, geom: { prst: 'ellipse' } },
          ],
        }] } },
        layoutRef: 'layout1', show: true, showMasterSp: null, mediaRefs: {} }],
      relsGraph: { slide1: { layout: 'layout1', media: {} } },
      mediaAssets: [],
    };
    const semantic = transformToSemanticIR(ir, createNoopLogger());
    const els = semantic.slides[0].elements;
    expect(els.find(e => e.id === 'grp1')).toBeUndefined();
    expect(els.find(e => e.id === 'spA')).toBeDefined();
    expect(els.find(e => e.id === 'spB')).toBeDefined();
  });

  it('B5: grpSp 缺 chOff/chExt → fallback chOff=(0,0), 不是 group.off', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },
      masters: [{ id: 'master1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        clrMap: { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2', accent1: 'accent1', accent2: 'accent2', accent3: 'accent3', accent4: 'accent4', accent5: 'accent5', accent6: 'accent6', hlink: 'hlink', folHlink: 'folHlink' }, themeRef: 'theme1', showMasterSp: true, mediaRefs: {} }],
      themes: [{ id: 'theme1', filePath: '', clrScheme: { dk1: '#000', lt1: '#fff', dk2: '#222', lt2: '#eee', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' }, fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' }, fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } }],
      layouts: [{ id: 'layout1', filePath: '', cSld: { bg: null, spTree: { children: [] } }, masterRef: 'master1', clrMapOvr: null, showMasterSp: null, mediaRefs: {} }],
      slides: [{ id: 'slide1', filePath: '',
        cSld: { bg: null, spTree: { children: [{
          kind: 'grpSp', id: 'grp1',
          // grpSp 有 off + ext 但缺 chOff/chExt
          xfrm: { off: { x: 100, y: 100 }, ext: { cx: 200, cy: 200 } },
          children: [
            // 预期: chOff=(0,0), chExt 默认 ext=(200,200), sx=sy=1
            // projected.x = group.off.x + (child.off.x - chOff.x) * sx = 100 + (50 - 0) * 1 = 150
            // projected.y = 100 + (50 - 0) * 1 = 150
            // bug 实现: chOff fallback group.off=(100,100) → projected.x = 100 + (50-100)*1 = 50
            { kind: 'sp', id: 'spA', xfrm: { off: { x: 50, y: 50 }, ext: { cx: 100, cy: 100 } }, geom: { prst: 'rect' } },
          ],
        }] } },
        layoutRef: 'layout1', show: true, showMasterSp: null, mediaRefs: {} }],
      relsGraph: { slide1: { layout: 'layout1', media: {} } },
      mediaAssets: [],
    };
    const semantic = transformToSemanticIR(ir, createNoopLogger());
    const spA = semantic.slides[0].elements.find(e => e.id === 'spA');
    expect(spA).toBeDefined();
    // 预期 bbox.x = 150 EMU / 9525 ≈ 0.01575 px
    expect(spA?.bbox.x).toBeCloseTo(150 / 9525, 4);
    expect(spA?.bbox.y).toBeCloseTo(150 / 9525, 4);
  });

  it('A3: case sp 含 txBody → SemanticShape.text 填充', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },
      masters: [{ id: 'master1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        clrMap: { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2', accent1: 'accent1', accent2: 'accent2', accent3: 'accent3', accent4: 'accent4', accent5: 'accent5', accent6: 'accent6', hlink: 'hlink', folHlink: 'folHlink' }, themeRef: 'theme1', showMasterSp: true, mediaRefs: {} }],
      themes: [{ id: 'theme1', filePath: '',
        clrScheme: { dk1: '#000', lt1: '#fff', dk2: '#222', lt2: '#eee', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
        fontScheme: { majorLatin: 'Calibri Light', minorLatin: 'Calibri', majorEa: '微软雅黑', minorEa: '宋体' },
        fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } }],
      layouts: [{ id: 'layout1', filePath: '', cSld: { bg: null, spTree: { children: [] } }, masterRef: 'master1', clrMapOvr: null, showMasterSp: null, mediaRefs: {} }],
      slides: [{ id: 'slide1', filePath: '',
        cSld: { bg: null, spTree: { children: [{
          kind: 'sp', id: 'spText',
          xfrm: { off: { x: 0, y: 0 }, ext: { cx: 1000, cy: 1000 } },
          geom: { prst: 'rect' },
          txBody: {
            bodyPr: { lIns: 91440 },
            paragraphs: [
              { pPr: { algn: 'ctr' }, runs: [{ rPr: { sz: 2400, b: true, color: { type: 'srgb', val: 'FF0000' } }, text: '红色加粗标题' }] },
            ],
          },
        }] } },
        layoutRef: 'layout1', show: true, showMasterSp: null, mediaRefs: {} }],
      relsGraph: { slide1: { layout: 'layout1', media: {} } },
      mediaAssets: [],
    };
    const semantic = transformToSemanticIR(ir, createNoopLogger());
    const spText = semantic.slides[0].elements.find(e => e.id === 'spText');
    expect(spText).toBeDefined();
    expect(spText?.kind).toBe('shape');
    if (spText?.kind === 'shape') {
      expect(spText.text).not.toBeNull();
      expect(spText.text?.paragraphs).toHaveLength(1);
      expect(spText.text?.paragraphs[0].runs[0].text).toBe('红色加粗标题');
      expect(spText.text?.paragraphs[0].pStyle).toContain('text-align: center');
      expect(spText.text?.paragraphs[0].runs[0].rStyle).toContain('font-size: 24pt');
      expect(spText.text?.paragraphs[0].runs[0].rStyle).toContain('font-weight: bold');
      expect(spText.text?.paragraphs[0].runs[0].rStyle).toContain('#FF0000');
    }
  });

  it('A3: case sp 无 txBody → SemanticShape.text 仍 null', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },
      masters: [{ id: 'master1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        clrMap: { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2', accent1: 'accent1', accent2: 'accent2', accent3: 'accent3', accent4: 'accent4', accent5: 'accent5', accent6: 'accent6', hlink: 'hlink', folHlink: 'folHlink' }, themeRef: 'theme1', showMasterSp: true, mediaRefs: {} }],
      themes: [{ id: 'theme1', filePath: '',
        clrScheme: { dk1: '#000', lt1: '#fff', dk2: '#222', lt2: '#eee', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
        fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' },
        fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } }],
      layouts: [{ id: 'layout1', filePath: '', cSld: { bg: null, spTree: { children: [] } }, masterRef: 'master1', clrMapOvr: null, showMasterSp: null, mediaRefs: {} }],
      slides: [{ id: 'slide1', filePath: '',
        cSld: { bg: null, spTree: { children: [{
          kind: 'sp', id: 'spNoText',
          xfrm: { off: { x: 0, y: 0 }, ext: { cx: 100, cy: 100 } },
          geom: { prst: 'rect' },
          fill: { type: 'solid', color: { type: 'srgb', val: '4472C4' } },
        }] } },
        layoutRef: 'layout1', show: true, showMasterSp: null, mediaRefs: {} }],
      relsGraph: { slide1: { layout: 'layout1', media: {} } },
      mediaAssets: [],
    };
    const semantic = transformToSemanticIR(ir, createNoopLogger());
    const spNoText = semantic.slides[0].elements.find(e => e.id === 'spNoText');
    if (spNoText?.kind === 'shape') {
      expect(spNoText.text).toBeNull();
    }
  });

  it('show=false 的 slide 不进 SemanticIR (追踪 #21)', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },  // T2: 4:3 默认
      masters: [{ id: 'master1', filePath: '', cSld: { bg: null, spTree: { children: [] } }, clrMap: { bg1: 'lt1' } as any, themeRef: 'theme1', showMasterSp: true, mediaRefs: {} }],
      themes: [{ id: 'theme1', filePath: '', clrScheme: {} as any, fontScheme: {} as any, fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } }],
      layouts: [{ id: 'layout1', filePath: '', cSld: { bg: null, spTree: { children: [] } }, masterRef: 'master1', clrMapOvr: null, showMasterSp: null, mediaRefs: {} }],
      slides: [{ id: 'slide1', filePath: '', cSld: { bg: null, spTree: { children: [] } }, layoutRef: 'layout1', show: false, showMasterSp: null, mediaRefs: {} }],
      relsGraph: { slide1: { layout: 'layout1', media: {} } },
      mediaAssets: [],   // T4
    };
    expect(transformToSemanticIR(ir, createNoopLogger()).slides).toHaveLength(0);
  });
});
