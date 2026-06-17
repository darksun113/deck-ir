import { describe, it, expect } from 'vitest';
import { renderShape } from './render-pipeline';
import type { RawShape, RawTheme, RawClrMap } from '../../ir/raw';

const mockTheme: RawTheme = {
  id: 't1', filePath: '',
  clrScheme: { dk1: '#000000', lt1: '#FFFFFF', dk2: '#222222', lt2: '#EEEEEE', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5', accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72' },
  fontScheme: { majorLatin: 'Calibri', minorLatin: 'Calibri', majorEa: '', minorEa: '' },
  fmtScheme: { fillStyleLst: [], lineStyleLst: [], bgFillStyleLst: [] },
};
const mockClrMap: RawClrMap = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2', accent1: 'accent1', accent2: 'accent2', accent3: 'accent3', accent4: 'accent4', accent5: 'accent5', accent6: 'accent6', hlink: 'hlink', folHlink: 'folHlink' };
const mockSlideBackground = { cssBackground: '#FFFFFF', w: 1280, h: 720 };

describe('renderShape (追踪 #35)', () => {
  it('rect + solidFill → div + bbox + 内联背景色', () => {
    const raw: RawShape = {
      kind: 'sp', id: 'sp1',
      xfrm: { off: { x: 914400, y: 685800 }, ext: { cx: 2743200, cy: 1828800 } },
      geom: { prst: 'rect' },
      fill: { type: 'solid', color: { type: 'srgb', val: '4472C4' } },
    };
    const result = renderShape(raw, mockTheme, mockClrMap, mockSlideBackground);
    expect(result.bbox).toEqual({ x: 96, y: 72, w: 288, h: 192 });
    expect(result.geometry.type).toBe('div');
    expect(result.fill?.css).toBe('background-color: #4472C4;');
  });

  it('T8: schemeClr accent1 fill → 渲染 #4472C4', () => {
    const raw: RawShape = {
      kind: 'sp', id: 'sp1',
      xfrm: { off: { x: 0, y: 0 }, ext: { cx: 100, cy: 100 } },
      geom: { prst: 'rect' },
      fill: { type: 'solid', color: { type: 'scheme', val: 'accent1' } },
    };
    const result = renderShape(raw, mockTheme, mockClrMap, mockSlideBackground);
    expect(result.fill?.css).toContain('#4472C4');
  });

  it('W1: useBgFill=true → fill 用 applyUseBgFill 输出, 含 background-size + position', () => {
    const raw: RawShape = {
      kind: 'sp', id: 'sp1',
      xfrm: { off: { x: 9525, y: 19050 }, ext: { cx: 95250, cy: 95250 } },
      geom: { prst: 'rect' },
      useBgFill: true,
    };
    const slideBackground = { cssBackground: 'linear-gradient(45deg, #ff0, #f00)', w: 1280, h: 720 };
    const result = renderShape(raw, mockTheme, mockClrMap, slideBackground);
    expect(result.fill?.css).toContain('background: linear-gradient(45deg, #ff0, #f00);');
    expect(result.fill?.css).toContain('background-size: 1280px 720px;');
    expect(result.fill?.css).toMatch(/background-position: -\d+px -\d+px;/);
  });

  it('C4: gradient fill → background: linear-gradient(...)', () => {
    const raw: RawShape = {
      kind: 'sp', id: 'sp1',
      xfrm: { off: { x: 0, y: 0 }, ext: { cx: 100, cy: 100 } },
      geom: { prst: 'rect' },
      fill: {
        type: 'gradient',
        gradient: {
          stops: [
            { pos: 0, color: { type: 'srgb', val: 'FF0000' } },
            { pos: 100000, color: { type: 'srgb', val: '00FF00' } },
          ],
          angle: 5400000,
        },
      },
    };
    const result = renderShape(raw, mockTheme, mockClrMap, mockSlideBackground);
    expect(result.fill?.css).toContain('linear-gradient');
    expect(result.fill?.css).toContain('#FF0000');
    expect(result.fill?.css).toContain('#00FF00');
  });

  it('C4: blip fill → background-image: url(...)', () => {
    const raw: RawShape = {
      kind: 'sp', id: 'sp1',
      xfrm: { off: { x: 0, y: 0 }, ext: { cx: 100, cy: 100 } },
      geom: { prst: 'rect' },
      fill: {
        type: 'blip',
        blipRef: { embed: 'rId5', stretch: true },
      },
    };
    const result = renderShape(raw, mockTheme, mockClrMap, mockSlideBackground);
    // blip 在 render-pipeline 层只输出 placeholder CSS, adapter 后续替换实际 URL
    expect(result.fill?.css).toMatch(/background.*(url|image)/i);
  });
});
