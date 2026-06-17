import type { RawIR, RawClrMap } from '../ir/raw';

export interface SlideLineage {
  slideId: string;
  layoutId: string;
  masterId: string;
  themeId: string;
  effectiveClrMap: RawClrMap;       // 优先 layout.clrMapOvr,否则 master.clrMap
  effectiveShowMasterSp: boolean;   // 追踪 #22 覆盖优先模型
}

export function buildLineages(ir: RawIR): SlideLineage[] {
  return ir.slides.map((slide) => {
    const layout = ir.layouts.find((l) => l.id === slide.layoutRef);
    if (!layout) throw new Error(`layout ${slide.layoutRef} not found for slide ${slide.id}`);
    const master = ir.masters.find((m) => m.id === layout.masterRef);
    if (!master) throw new Error(`master ${layout.masterRef} not found for layout ${layout.id}`);
    const theme = ir.themes.find((t) => t.id === master.themeRef);
    if (!theme) throw new Error(`theme ${master.themeRef} not found for master ${master.id}`);

    const effectiveClrMap = layout.clrMapOvr ?? master.clrMap;
    // 追踪 #22 覆盖优先模型: slide 永远覆盖 layout
    const effectiveShowMasterSp = slide.showMasterSp ?? layout.showMasterSp ?? master.showMasterSp;

    return {
      slideId: slide.id, layoutId: layout.id, masterId: master.id, themeId: theme.id,
      effectiveClrMap, effectiveShowMasterSp,
    };
  });
}
