// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { parseCSld, parseSpTreeChildren } from './_shared-csld';
import type { RuleLogger, RuleApplyEvent } from '../logger/types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function parseBgFromXml(xml: string) {
  const doc = parser.parse(xml);
  return parseCSld(doc['p:cSld']).bg;
}

describe('parseBackground (B1)', () => {
  it('solidFill srgbClr → bgPr.fill.color.srgb', () => {
    const xml = `<p:cSld xmlns:p="x" xmlns:a="y">
      <p:bg><p:bgPr><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></p:bgPr></p:bg>
      <p:spTree/>
    </p:cSld>`;
    const bg = parseBgFromXml(xml);
    expect(bg?.bgPr?.fill.type).toBe('solid');
    expect(bg?.bgPr?.fill.color).toEqual({ type: 'srgb', val: 'FF0000' });
  });

  it('solidFill schemeClr 含 modifiers', () => {
    const xml = `<p:cSld xmlns:p="x" xmlns:a="y">
      <p:bg><p:bgPr><a:solidFill><a:schemeClr val="accent1"><a:lumMod val="60000"/></a:schemeClr></a:solidFill></p:bgPr></p:bg>
      <p:spTree/>
    </p:cSld>`;
    const bg = parseBgFromXml(xml);
    expect(bg?.bgPr?.fill.type).toBe('solid');
    expect(bg?.bgPr?.fill.color?.type).toBe('scheme');
    expect(bg?.bgPr?.fill.color?.val).toBe('accent1');
    expect(bg?.bgPr?.fill.color?.modifiers).toEqual([{ name: 'lumMod', val: 60000 }]);
  });

  it('gradFill → type=gradient (stops Plan 2)', () => {
    const xml = `<p:cSld xmlns:p="x" xmlns:a="y">
      <p:bg><p:bgPr><a:gradFill><a:gsLst/></a:gradFill></p:bgPr></p:bg>
      <p:spTree/>
    </p:cSld>`;
    const bg = parseBgFromXml(xml);
    expect(bg?.bgPr?.fill.type).toBe('gradient');
  });

  it('noFill → type=none', () => {
    const xml = `<p:cSld xmlns:p="x" xmlns:a="y">
      <p:bg><p:bgPr><a:noFill/></p:bgPr></p:bg>
      <p:spTree/>
    </p:cSld>`;
    const bg = parseBgFromXml(xml);
    expect(bg?.bgPr?.fill.type).toBe('none');
  });

  it('blipFill → type=blip + embed (rels Plan 2)', () => {
    const xml = `<p:cSld xmlns:p="x" xmlns:a="y" xmlns:r="z">
      <p:bg><p:bgPr><a:blipFill><a:blip r:embed="rId7"/></a:blipFill></p:bgPr></p:bg>
      <p:spTree/>
    </p:cSld>`;
    const bg = parseBgFromXml(xml);
    expect(bg?.bgPr?.fill.type).toBe('blip');
    expect(bg?.bgPr?.fill.blipRef?.embed).toBe('rId7');
  });

  it('bgRef → bgRef.idx (Plan 2 解析 fmtScheme)', () => {
    const xml = `<p:cSld xmlns:p="x" xmlns:a="y">
      <p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
      <p:spTree/>
    </p:cSld>`;
    const bg = parseBgFromXml(xml);
    expect(bg?.bgRef?.idx).toBe(1001);
  });
});

describe('parseSpTreeChildren mc:AlternateContent dispatch (W2)', () => {
  it('W2: mc:Choice 内含 p:sp → 选 Choice 路径, sp 进入 children', () => {
    const xml = `<p:spTree xmlns:p="x" xmlns:a="y" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
      <mc:AlternateContent>
        <mc:Choice Requires="p14">
          <p:sp><p:nvSpPr><p:cNvPr id="10" name="ChoiceShape"/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>
        </mc:Choice>
        <mc:Fallback>
          <p:sp><p:nvSpPr><p:cNvPr id="11" name="FallbackShape"/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>
        </mc:Fallback>
      </mc:AlternateContent>
    </p:spTree>`;
    const spTree = parser.parse(xml)['p:spTree'];
    const result = parseSpTreeChildren(spTree, { mediaRefs: {} });
    const ids = result.map(c => c.id);
    expect(ids).toContain('10');
    expect(ids).not.toContain('11');
  });

  it('W2: mc:Choice 含不支持命名空间 → fallback Fallback 路径', () => {
    const xml = `<p:spTree xmlns:p="x" xmlns:a="y" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:p14="extension">
      <mc:AlternateContent>
        <mc:Choice Requires="p14">
          <p14:extendedThing/>
        </mc:Choice>
        <mc:Fallback>
          <p:sp><p:nvSpPr><p:cNvPr id="20" name="FallbackShape"/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>
        </mc:Fallback>
      </mc:AlternateContent>
    </p:spTree>`;
    const spTree = parser.parse(xml)['p:spTree'];
    const result = parseSpTreeChildren(spTree, { mediaRefs: {} });
    const ids = result.map(c => c.id);
    expect(ids).toContain('20');
  });
});

describe('parseSpTreeChildren W5 p:ink dispatch', () => {
  it('W5: spTree 含 p:ink → reuseInkAsShape 调用 (apply event), children 不含 ink', () => {
    const xml = `<p:spTree xmlns:p="x" xmlns:a="y">
      <p:ink/>
      <p:sp><p:nvSpPr><p:cNvPr id="30" name="NormalShape"/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>
    </p:spTree>`;
    const applyEvents: RuleApplyEvent[] = [];
    const spyLogger: RuleLogger = {
      apply: (e) => applyEvents.push(e),
      warn: () => {},
      error: () => {},
    };
    const spTree = parser.parse(xml)['p:spTree'];
    const children = parseSpTreeChildren(spTree, { mediaRefs: {}, logger: spyLogger, slideRef: 'slide1' });
    // children 只含 NormalShape, ink 被丢
    expect(children.length).toBe(1);
    expect(children[0].id).toBe('30');
    // spy 应该捕获 reuseInkAsShape 的 apply event
    const inkEvent = applyEvents.find(
      (e) => e.decisionId === '#59' || e.context.element === 'p:ink',
    );
    expect(inkEvent).toBeDefined();
  });
});
