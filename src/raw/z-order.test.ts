// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { buildZOrderIndex } from './z-order';

const xml = `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
 <p:cSld><p:spTree>
   <p:pic><p:nvPicPr><p:cNvPr id="10" name="bg"/></p:nvPicPr></p:pic>
   <p:sp><p:nvSpPr><p:cNvPr id="20" name="title"/></p:nvSpPr></p:sp>
   <p:grpSp><p:nvGrpSpPr><p:cNvPr id="30" name="grp"/></p:nvGrpSpPr>
     <p:sp><p:nvSpPr><p:cNvPr id="31" name="inner"/></p:nvSpPr></p:sp>
   </p:grpSp>
 </p:spTree></p:cSld>
</p:sld>`;

describe('buildZOrderIndex', () => {
  it('按文档顺序给每个 cNvPr id 编号(含嵌套 grpSp)', () => {
    const idx = buildZOrderIndex(xml);
    expect(idx.get('10')!).toBeLessThan(idx.get('20')!);   // pic(底) < title(上)
    expect(idx.get('20')!).toBeLessThan(idx.get('30')!);   // title < group
    expect(idx.get('30')!).toBeLessThan(idx.get('31')!);   // group < its child (DFS 前序)
  });
});
