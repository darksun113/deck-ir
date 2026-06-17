import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseSlide } from './slide';
import { createCollectorLogger } from '../logger';

describe('parseSlide', () => {
  it('解析 show + layoutRef', () => {
    const xml = readFileSync(path.join(__dirname, '../../../../../../tests/integration/fixtures/phase-a/minimal-slide.xml'), 'utf8');
    const rels = readFileSync(path.join(__dirname, '../../../../../../tests/integration/fixtures/phase-a/minimal-slide.xml.rels'), 'utf8');
    const slide = parseSlide('slide1', '/ppt/slides/slide1.xml', xml, rels);
    expect(slide.show).toBe(true);
    expect(slide.layoutRef).toBe('layout1');
    expect(slide.showMasterSp).toBeNull();  // 未指定 (追踪 #22)
  });
});

describe('parseSlide W3 wiring', () => {
  it('W3: sld 含 p:transition → logger.warn 触发', () => {
    const collector = createCollectorLogger();
    const xml = `<p:sld xmlns:p="x"><p:cSld><p:spTree/></p:cSld><p:transition spd="med"/></p:sld>`;
    const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    </Relationships>`;
    parseSlide('slide1', '/ppt/slides/slide1.xml', xml, rels, collector);
    const warns = collector.toStrings();
    expect(warns.some(w => w.includes('p:transition'))).toBe(true);
  });

  it('W3: sld 无 p:transition → 无 warn', () => {
    const collector = createCollectorLogger();
    const xml = `<p:sld xmlns:p="x"><p:cSld><p:spTree/></p:cSld></p:sld>`;
    const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    </Relationships>`;
    parseSlide('slide1', '/ppt/slides/slide1.xml', xml, rels, collector);
    const warns = collector.toStrings().filter(w => w.includes('p:transition'));
    expect(warns.length).toBe(0);
  });
});
