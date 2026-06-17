// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import type { RawIR } from './raw';

describe('RawIR types', () => {
  it('编译期检查: 完整 RawIR 结构可构造', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },  // T2: 4:3 默认
      masters: [{
        id: 'master1', filePath: 'ppt/slideMasters/slideMaster1.xml',
        cSld: { bg: null, spTree: { children: [] } },
        clrMap: { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2',
                  accent1: 'accent1', accent2: 'accent2', accent3: 'accent3',
                  accent4: 'accent4', accent5: 'accent5', accent6: 'accent6',
                  hlink: 'hlink', folHlink: 'folHlink' },
        themeRef: 'theme1', showMasterSp: true,
        mediaRefs: {},
      }],
      themes: [{
        id: 'theme1', filePath: 'ppt/theme/theme1.xml',
        clrScheme: { dk1: '#000000', lt1: '#FFFFFF', dk2: '#1F497D', lt2: '#EEECE1',
                     accent1: '#4F81BD', accent2: '#C0504D', accent3: '#9BBB59',
                     accent4: '#8064A2', accent5: '#4BACC6', accent6: '#F79646',
                     hlink: '#0000FF', folHlink: '#800080' },
        fontScheme: { majorLatin: 'Calibri Light', minorLatin: 'Calibri', majorEa: '', minorEa: '' },
        fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] },
      }],
      layouts: [{
        id: 'layout1', filePath: 'ppt/slideLayouts/slideLayout1.xml',
        cSld: { bg: null, spTree: { children: [] } },
        masterRef: 'master1', clrMapOvr: null, showMasterSp: null,
        type: 'title',
        mediaRefs: {},
      }],
      slides: [{
        id: 'slide1', filePath: 'ppt/slides/slide1.xml',
        cSld: { bg: null, spTree: { children: [] } },
        layoutRef: 'layout1', show: true, showMasterSp: null,
        mediaRefs: {},
      }],
      relsGraph: { 'slide1': { layout: 'layout1', media: {} } },
      mediaAssets: [],   // T4
    };
    expect(ir.masters).toHaveLength(1);
    expect(ir.slides[0].layoutRef).toBe('layout1');
  });
});
