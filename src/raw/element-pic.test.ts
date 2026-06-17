// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { parsePicture } from './element-pic';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

describe('parsePicture', () => {
  it('提取 embed + xfrm + srcRect', () => {
    const xml = `<p:pic xmlns:p="x" xmlns:a="y" xmlns:r="z">
      <p:nvPicPr><p:cNvPr id="5" name="Image 1" descr="logo"/><p:nvPicPr/></p:nvPicPr>
      <p:blipFill>
        <a:blip r:embed="rId5"/>
        <a:srcRect l="1000" t="0" r="2000" b="500"/>
      </p:blipFill>
      <p:spPr>
        <a:xfrm><a:off x="100" y="200"/><a:ext cx="300" cy="400"/></a:xfrm>
      </p:spPr>
    </p:pic>`;
    const result = parsePicture(parser.parse(xml)['p:pic'], { mediaRefs: { rId5: '/ppt/media/image1.png' } });
    expect(result.kind).toBe('pic');
    expect(result.id).toBe('5');
    expect(result.blipRef.embed).toBe('rId5');
    expect(result.srcRect).toEqual({ l: 1000, t: 0, r: 2000, b: 500 });
    expect(result.xfrm?.off).toEqual({ x: 100, y: 200 });
    expect(result.cNvPr?.descr).toBe('logo');
  });
});
