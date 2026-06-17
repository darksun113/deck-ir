// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { parseShape, parseConnector } from './element-sp';
import { createCollectorLogger } from '../logger';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

describe('parseShape', () => {
  it('提取 id + name + xfrm + prstGeom + solidFill', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y" xmlns:r="z">
      <p:nvSpPr><p:cNvPr id="2" name="Rectangle 1"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="914400" y="685800"/><a:ext cx="2743200" cy="1828800"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="4472c4"/></a:solidFill>
      </p:spPr>
    </p:sp>`;
    const doc = parser.parse(xml);
    const result = parseShape(doc['p:sp']);
    expect(result.kind).toBe('sp');
    expect(result.id).toBe('2');
    expect(result.name).toBe('Rectangle 1');
    expect(result.xfrm?.off).toEqual({ x: 914400, y: 685800 });
    expect(result.xfrm?.ext).toEqual({ cx: 2743200, cy: 1828800 });
    expect(result.geom?.prst).toBe('rect');
    expect(result.fill?.type).toBe('solid');
    expect(result.fill?.color).toEqual({ type: 'srgb', val: '4472C4' });
  });

  it('schemeClr 填充', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="3" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></p:spPr>
    </p:sp>`;
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.fill?.color).toEqual({ type: 'scheme', val: 'accent1' });
  });

  it('schemeClr 含 lumMod/lumOff modifiers 被捕获', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="5" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:solidFill>
          <a:schemeClr val="accent1">
            <a:lumMod val="75000"/>
            <a:lumOff val="25000"/>
          </a:schemeClr>
        </a:solidFill>
      </p:spPr>
    </p:sp>`;
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.fill?.color).toEqual({
      type: 'scheme',
      val: 'accent1',
      modifiers: [{ name: 'lumMod', val: 75000 }, { name: 'lumOff', val: 25000 }],
    });
  });

  it('B2: schemeClr 含 lumOff 在 lumMod 前 → modifiers 顺序保留 [lumOff, lumMod]', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="6" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:solidFill>
          <a:schemeClr val="accent1">
            <a:lumOff val="40000"/>
            <a:lumMod val="60000"/>
          </a:schemeClr>
        </a:solidFill>
      </p:spPr>
    </p:sp>`;
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.fill?.color?.modifiers).toEqual([
      { name: 'lumOff', val: 40000 },
      { name: 'lumMod', val: 60000 },
    ]);
  });

  it('B2: 反过来 lumMod 在 lumOff 前 → modifiers 顺序 [lumMod, lumOff]', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="7" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:solidFill>
          <a:schemeClr val="accent1">
            <a:lumMod val="60000"/>
            <a:lumOff val="40000"/>
          </a:schemeClr>
        </a:solidFill>
      </p:spPr>
    </p:sp>`;
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.fill?.color?.modifiers).toEqual([
      { name: 'lumMod', val: 60000 },
      { name: 'lumOff', val: 40000 },
    ]);
  });

  it('B2: parseShape 解析 p:style.fillRef + lnRef + effectRef + fontRef', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="20" name="ThemedShape"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:style>
        <a:lnRef idx="2"><a:schemeClr val="accent1"/></a:lnRef>
        <a:fillRef idx="1"><a:schemeClr val="accent2"/></a:fillRef>
        <a:effectRef idx="0"><a:schemeClr val="accent1"/></a:effectRef>
        <a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef>
      </p:style>
    </p:sp>`;
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.styleRef?.fillRef?.idx).toBe(1);
    expect(result.styleRef?.fillRef?.color?.val).toBe('accent2');
    expect(result.styleRef?.lineRef?.idx).toBe(2);
    expect(result.styleRef?.lineRef?.color?.val).toBe('accent1');
  });

  it('C2: blipFill 含 srcRect + stretch', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y" xmlns:r="z">
      <p:nvSpPr><p:cNvPr id="40" name="ImageShape"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:blipFill>
          <a:blip r:embed="rId8"/>
          <a:srcRect l="1000" t="2000" r="3000" b="4000"/>
          <a:stretch><a:fillRect/></a:stretch>
        </a:blipFill>
      </p:spPr>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.fill?.type).toBe('blip');
    expect(result.fill?.blipRef?.embed).toBe('rId8');
    expect(result.fill?.blipRef?.srcRect).toEqual({ l: 1000, t: 2000, r: 3000, b: 4000 });
    expect(result.fill?.blipRef?.stretch).toBe(true);
  });

  it('C2: blipFill 含 tile', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y" xmlns:r="z">
      <p:nvSpPr><p:cNvPr id="41" name="TiledImage"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:blipFill>
          <a:blip r:embed="rId9"/>
          <a:tile sx="100000" sy="100000" tx="0" ty="0" algn="tl"/>
        </a:blipFill>
      </p:spPr>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.fill?.blipRef?.tile?.sx).toBe(100000);
    expect(result.fill?.blipRef?.tile?.algn).toBe('tl');
  });

  it('C3: pattFill → type=pattern + prst', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="50" name="PatternShape"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:pattFill prst="diagBrick">
          <a:fgClr><a:srgbClr val="FF0000"/></a:fgClr>
          <a:bgClr><a:srgbClr val="FFFFFF"/></a:bgClr>
        </a:pattFill>
      </p:spPr>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.fill?.type).toBe('pattern');
    expect(result.fill?.pattPrst).toBe('diagBrick');
  });

  it('ph (占位符) 元数据', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="4" name="Title 1"/><p:nvPr><p:ph type="title" idx="0"/></p:nvPr></p:nvSpPr>
      <p:spPr/>
    </p:sp>`;
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.ph?.type).toBe('title');
    expect(result.ph?.idx).toBe('0');
  });

  it('A1.1: parseTxBody 主结构 (bodyPr + paragraphs + runs)', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="100" name="TextShape"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr lIns="91440" rIns="91440" tIns="45720" bIns="45720" vert="horz" anchor="t"/>
        <a:p>
          <a:pPr algn="l" marL="0" indent="0"/>
          <a:r>
            <a:rPr lang="zh-CN" sz="2400" b="1">
              <a:solidFill><a:srgbClr val="000000"/></a:solidFill>
              <a:latin typeface="Calibri"/>
            </a:rPr>
            <a:t>标题文本</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:pPr algn="ctr"/>
          <a:r>
            <a:rPr lang="en-US" sz="1800"/>
            <a:t>Second paragraph</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
    // A1.1: 用 stopNodes 模拟生产环境 slide.ts 解析路径 (txBody 进 element-sp 时是原始 XML 字符串)
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.txBody).toBeDefined();
    expect(result.txBody?.bodyPr?.lIns).toBe(91440);
    expect(result.txBody?.bodyPr?.anchor).toBe('t');
    expect(result.txBody?.paragraphs).toHaveLength(2);
    expect(result.txBody?.paragraphs[0].pPr?.algn).toBe('l');
    expect(result.txBody?.paragraphs[0].runs).toHaveLength(1);
    expect(result.txBody?.paragraphs[0].runs[0].text).toBe('标题文本');
    expect(result.txBody?.paragraphs[0].runs[0].rPr?.sz).toBe(2400);
    expect(result.txBody?.paragraphs[0].runs[0].rPr?.b).toBe(true);
    expect(result.txBody?.paragraphs[0].runs[0].rPr?.latin).toBe('Calibri');
    expect(result.txBody?.paragraphs[1].pPr?.algn).toBe('ctr');
  });

  it('A1.1: 空 a:p (无 runs) → paragraphs 数组保留 (空行)', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="101" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr/>
        <a:p/>
        <a:p><a:r><a:t>有文字</a:t></a:r></a:p>
      </p:txBody>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.txBody?.paragraphs).toHaveLength(2);
    expect(result.txBody?.paragraphs[0].runs).toEqual([]);
    expect(result.txBody?.paragraphs[1].runs[0].text).toBe('有文字');
  });

  it('A1.1: a:br 段内换行 → 单独 run text="\\n"', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="102" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr/>
        <a:p>
          <a:r><a:t>第一行</a:t></a:r>
          <a:br/>
          <a:r><a:t>第二行</a:t></a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    const runs = result.txBody?.paragraphs[0].runs ?? [];
    expect(runs.map(r => r.text)).toEqual(['第一行', '\n', '第二行']);
  });

  it('A1.1: a:fld 字段 → 占位 text="[字段]"', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="103" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr/>
        <a:p>
          <a:r><a:t>第 </a:t></a:r>
          <a:fld id="{ABC}" type="slidenum"><a:t>1</a:t></a:fld>
          <a:r><a:t> 页</a:t></a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    const runs = result.txBody?.paragraphs[0].runs ?? [];
    expect(runs.map(r => r.text)).toContain('[字段]');
  });

  it('A1.2: buAutoNum (arabicPeriod, startAt=1)', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="110" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr/>
        <a:p>
          <a:pPr><a:buAutoNum type="arabicPeriod" startAt="1"/></a:pPr>
          <a:r><a:t>第一项</a:t></a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.txBody?.paragraphs[0].pPr?.bullet?.auto?.type).toBe('arabicPeriod');
    expect(result.txBody?.paragraphs[0].pPr?.bullet?.auto?.startAt).toBe(1);
  });

  it('A1.2: buChar (l 字符) + buFont (Wingdings)', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="111" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr/>
        <a:p>
          <a:pPr>
            <a:buFont typeface="Wingdings"/>
            <a:buChar char="l"/>
          </a:pPr>
          <a:r><a:t>项目</a:t></a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.txBody?.paragraphs[0].pPr?.bullet?.char).toBe('l');
    expect(result.txBody?.paragraphs[0].pPr?.bullet?.font).toBe('Wingdings');
  });

  it('A1.2: buNone (显式无项目符号)', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="112" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr/>
        <a:p>
          <a:pPr><a:buNone/></a:pPr>
          <a:r><a:t>无 bullet</a:t></a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.txBody?.paragraphs[0].pPr?.bullet?.none).toBe(true);
  });

  it('A1.3: rPr 完整字段 (cs + sym + strike + baseline)', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="120" name="x"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
      <p:txBody>
        <a:bodyPr/>
        <a:p>
          <a:r>
            <a:rPr lang="en-US" sz="1800" strike="sngStrike" baseline="30000">
              <a:latin typeface="Calibri"/>
              <a:cs typeface="Arabic Typesetting"/>
              <a:sym typeface="Wingdings"/>
            </a:rPr>
            <a:t>complete</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
    const result = parseShape(parser.parse(xml)['p:sp']);
    const rPr = result.txBody?.paragraphs[0].runs[0].rPr;
    expect(rPr?.cs).toBe('Arabic Typesetting');
    expect(rPr?.sym).toBe('Wingdings');
    expect(rPr?.strike).toBe('sngStrike');
    expect(rPr?.baseline).toBe(30000);
  });

  it('A1.1: 无 txBody → result.txBody undefined', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="104" name="NoText"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
    </p:sp>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const result = parseShape(parser.parse(xml)['p:sp']);
    expect(result.txBody).toBeUndefined();
  });
});

describe('parseShape W4 wiring (3D effects)', () => {
  it('W4: parseShape 检测 a:scene3d → skip3DEffects warn', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="8" name="3DShape"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:scene3d><a:camera prst="orthographicFront"/><a:lightRig rig="threePt" dir="t"/></a:scene3d>
      </p:spPr>
    </p:sp>`;
    const collector = createCollectorLogger();
    parseShape(parser.parse(xml)['p:sp'], { logger: collector, slideRef: 'slide1' });
    const warns = collector.toStrings();
    expect(warns.some(w => w.includes('scene3d') || w.includes('3D') || w.includes('#58'))).toBe(true);
  });

  it('W4: parseShape 检测 a:sp3d → skip3DEffects warn', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="9" name="3DShape"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:sp3d><a:bevelT w="63500" h="25400"/></a:sp3d>
      </p:spPr>
    </p:sp>`;
    const collector = createCollectorLogger();
    parseShape(parser.parse(xml)['p:sp'], { logger: collector, slideRef: 'slide1' });
    const warns = collector.toStrings();
    expect(warns.some(w => w.includes('sp3d') || w.includes('3D') || w.includes('#58'))).toBe(true);
  });

  it('W4: parseShape 无 3D 节点 → 无 3D warn', () => {
    const xml = `<p:sp xmlns:p="x" xmlns:a="y">
      <p:nvSpPr><p:cNvPr id="10" name="NormalShape"/><p:nvPr/></p:nvSpPr>
      <p:spPr/>
    </p:sp>`;
    const collector = createCollectorLogger();
    parseShape(parser.parse(xml)['p:sp'], { logger: collector, slideRef: 'slide1' });
    const warns = collector.toStrings().filter(w => w.includes('3D') || w.includes('#58'));
    expect(warns.length).toBe(0);
  });
});

describe('parseConnector(cxnSp → 线形状) (2D-B)', () => {
  const noopLogger = { apply() {}, warn() {}, error() {} } as never;

  it('直线连接符 → RawShape,id 来自 cNvPr,xfrm 解析正确', () => {
    const cxn = {
      'p:nvCxnSpPr': { 'p:cNvPr': { '@_id': '3', '@_name': '直接连接符 3' } },
      'p:spPr': {
        'a:xfrm': { 'a:off': { '@_x': '419100', '@_y': '542925' }, 'a:ext': { '@_cx': '0', '@_cy': '285750' } },
        'a:prstGeom': { '@_prst': 'line' },
        'a:ln': { '@_w': '12700' },
      },
    };
    const shape = parseConnector(cxn as never, { logger: noopLogger, slideRef: 'slide1' });
    expect(shape.kind).toBe('sp');
    expect(shape.id).toBe('3');
    // xfrm: RawXfrm.off.x / ext.cx — 原始 EMU 整数
    expect(shape.xfrm?.off?.x).toBe(419100);
    expect(shape.xfrm?.off?.y).toBe(542925);
    expect(shape.xfrm?.ext?.cx).toBe(0);
    expect(shape.xfrm?.ext?.cy).toBe(285750);
  });

  it('prstGeom=line → geom.prst="line"', () => {
    const cxn = {
      'p:nvCxnSpPr': { 'p:cNvPr': { '@_id': '5', '@_name': 'Line 5' } },
      'p:spPr': {
        'a:xfrm': { 'a:off': { '@_x': '0', '@_y': '0' }, 'a:ext': { '@_cx': '100000', '@_cy': '0' } },
        'a:prstGeom': { '@_prst': 'straightConnector1' },
      },
    };
    const shape = parseConnector(cxn as never);
    expect(shape.geom?.prst).toBe('straightConnector1');
  });

  it('cxnSp 无 txBody → txBody undefined', () => {
    const cxn = {
      'p:nvCxnSpPr': { 'p:cNvPr': { '@_id': '7', '@_name': 'Connector 7' } },
      'p:spPr': { 'a:xfrm': { 'a:off': { '@_x': '0', '@_y': '0' }, 'a:ext': { '@_cx': '0', '@_cy': '0' } } },
    };
    const shape = parseConnector(cxn as never);
    expect(shape.txBody).toBeUndefined();
  });

  it('a:ln width → outline.width 为 EMU 整数', () => {
    const cxn = {
      'p:nvCxnSpPr': { 'p:cNvPr': { '@_id': '9', '@_name': 'Thick Line 9' } },
      'p:spPr': {
        'a:xfrm': { 'a:off': { '@_x': '0', '@_y': '0' }, 'a:ext': { '@_cx': '500000', '@_cy': '0' } },
        'a:ln': { '@_w': '25400' },
      },
    };
    const shape = parseConnector(cxn as never);
    expect(shape.outline?.width).toBe(25400);
  });
});
