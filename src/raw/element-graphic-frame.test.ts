import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { parseGraphicFrame } from './element-graphic-frame';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

describe('parseGraphicFrame', () => {
  it('提取 chart graphicFrame 的 uri', () => {
    const xml = `<p:graphicFrame xmlns:p="x" xmlns:a="y">
      <p:nvGraphicFramePr><p:cNvPr id="30" name="Chart 1"/></p:nvGraphicFramePr>
      <p:xfrm><a:off x="100" y="100"/><a:ext cx="500" cy="300"/></p:xfrm>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"/></a:graphic>
    </p:graphicFrame>`;
    const result = parseGraphicFrame(parser.parse(xml)['p:graphicFrame']);
    expect(result.kind).toBe('graphicFrame');
    expect(result.id).toBe('30');
    expect(result.uri).toContain('chart');
    expect(result.xfrm?.off).toEqual({ x: 100, y: 100 });
  });
});
