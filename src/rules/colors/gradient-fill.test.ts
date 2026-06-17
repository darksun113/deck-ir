import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { parseGradFill } from './gradient-fill';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

describe('parseGradFill (C1)', () => {
  it('双色线性渐变 (srgb stops + angle)', () => {
    const xml = `<a:gradFill xmlns:a="x">
      <a:gsLst>
        <a:gs pos="0"><a:srgbClr val="FF0000"/></a:gs>
        <a:gs pos="100000"><a:srgbClr val="00FF00"/></a:gs>
      </a:gsLst>
      <a:lin ang="5400000" scaled="1"/>
    </a:gradFill>`;
    const doc = parser.parse(xml);
    const fill = parseGradFill(doc['a:gradFill']);
    expect(fill.type).toBe('gradient');
    expect(fill.gradient?.stops).toEqual([
      { pos: 0, color: { type: 'srgb', val: 'FF0000' } },
      { pos: 100000, color: { type: 'srgb', val: '00FF00' } },
    ]);
    expect(fill.gradient?.angle).toBe(5400000);
    expect(fill.gradient?.scaled).toBe(true);
  });

  it('schemeClr phClr stops (fmtScheme 模板)', () => {
    const xml = `<a:gradFill xmlns:a="x">
      <a:gsLst>
        <a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="60000"/></a:schemeClr></a:gs>
        <a:gs pos="100000"><a:schemeClr val="phClr"/></a:gs>
      </a:gsLst>
    </a:gradFill>`;
    const doc = parser.parse(xml);
    const fill = parseGradFill(doc['a:gradFill']);
    expect(fill.gradient?.stops[0].color.val).toBe('phClr');
    expect(fill.gradient?.stops[0].color.modifiers).toEqual([{ name: 'lumMod', val: 60000 }]);
    expect(fill.gradient?.stops[1].color.val).toBe('phClr');
  });

  it('无 a:lin → angle undefined', () => {
    const xml = `<a:gradFill xmlns:a="x"><a:gsLst><a:gs pos="0"><a:srgbClr val="000000"/></a:gs></a:gsLst></a:gradFill>`;
    const doc = parser.parse(xml);
    const fill = parseGradFill(doc['a:gradFill']);
    expect(fill.gradient?.angle).toBeUndefined();
  });
});
