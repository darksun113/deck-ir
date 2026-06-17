import { describe, it, expect } from 'vitest';
import { buildLineages } from './lineage';
import type { RawIR } from '../ir/raw';

describe('buildLineages', () => {
  it('对每个 slide 建立 slide → layout → master → theme 链', () => {
    const ir: RawIR = {
      slideSize: { cx_emu: 9144000, cy_emu: 6858000 },  // T2: 4:3 默认
      masters: [{ id: 'master1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        clrMap: { bg1: 'lt1' } as any, themeRef: 'theme1', showMasterSp: true, mediaRefs: {} }],
      themes: [{ id: 'theme1', filePath: '', clrScheme: {} as any, fontScheme: {} as any, fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] } }],
      layouts: [{ id: 'layout1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        masterRef: 'master1', clrMapOvr: null, showMasterSp: null, mediaRefs: {} }],
      slides: [{ id: 'slide1', filePath: '', cSld: { bg: null, spTree: { children: [] } },
        layoutRef: 'layout1', show: true, showMasterSp: null, mediaRefs: {} }],
      relsGraph: { slide1: { layout: 'layout1', media: {} } },
      mediaAssets: [],   // T4
    };
    const lineages = buildLineages(ir);
    expect(lineages).toHaveLength(1);
    expect(lineages[0].slideId).toBe('slide1');
    expect(lineages[0].layoutId).toBe('layout1');
    expect(lineages[0].masterId).toBe('master1');
    expect(lineages[0].themeId).toBe('theme1');
    expect(lineages[0].effectiveClrMap.bg1).toBe('lt1');
  });
});
