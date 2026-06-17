// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { parsePptxToRawIR } from './parse-pptx';
import { createNoopLogger } from '../logger/noop';

const FIXTURE_DIR = path.join(__dirname, '../../tests/integration/fixtures/phase-a');
function f(name: string) { return readFileSync(path.join(FIXTURE_DIR, name), 'utf8'); }

async function buildMinimalPptxBuffer(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', f('minimal-content-types.xml'));
  zip.file('ppt/slideMasters/slideMaster1.xml', f('minimal-master.xml'));
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', f('minimal-master.xml.rels'));
  zip.file('ppt/theme/theme1.xml', f('minimal-theme.xml'));
  zip.file('ppt/slideLayouts/slideLayout1.xml', f('minimal-layout.xml'));
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', f('minimal-layout.xml.rels'));
  zip.file('ppt/slides/slide1.xml', f('minimal-slide.xml'));
  zip.file('ppt/slides/_rels/slide1.xml.rels', f('minimal-slide.xml.rels'));
  return Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
}

describe('parsePptxToRawIR', () => {
  it('解析运行时组装的最小 PPTX,产出含 1 master + 1 layout + 1 slide + 1 theme 的 RawIR', async () => {
    const buf = await buildMinimalPptxBuffer();
    const ir = await parsePptxToRawIR(buf, {
      logger: createNoopLogger(),
      readZipEntry: async (name) => name,
    });
    expect(ir.masters).toHaveLength(1);
    expect(ir.layouts).toHaveLength(1);
    expect(ir.slides).toHaveLength(1);
    expect(ir.themes).toHaveLength(1);
    expect(ir.slides[0].layoutRef).toMatch(/^layout/);
    expect(ir.masters[0].clrMap.bg1).toBe('lt1');
    expect(ir.themes[0].clrScheme.accent1).toBe('#4F81BD');
  });
});

// ---------- B4: id 统一从 filename digit 解析 ----------
async function buildMinimalPptxWithIdx(opts: { masterIdx: number; themeIdx: number; layoutIdx: number; slideIdx: number }): Promise<Buffer> {
  const zip = new JSZip();
  const { masterIdx, themeIdx, layoutIdx, slideIdx } = opts;

  zip.file('[Content_Types].xml', `<?xml version="1.0"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster${masterIdx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme${themeIdx}.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout${layoutIdx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slides/slide${slideIdx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);

  zip.file('ppt/presentation.xml', `<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldSz cx="12192000" cy="6858000"/></p:presentation>`);

  zip.file(`ppt/slideMasters/slideMaster${masterIdx}.xml`, `<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree/></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
</p:sldMaster>`);
  zip.file(`ppt/slideMasters/_rels/slideMaster${masterIdx}.xml.rels`, `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme${themeIdx}.xml"/>
</Relationships>`);

  zip.file(`ppt/theme/theme${themeIdx}.xml`, `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements>
    <a:clrScheme name="x">
      <a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="222222"/></a:dk2><a:lt2><a:srgbClr val="EEEEEE"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="x"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="x"/>
  </a:themeElements></a:theme>`);

  zip.file(`ppt/slideLayouts/slideLayout${layoutIdx}.xml`, `<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`);
  zip.file(`ppt/slideLayouts/_rels/slideLayout${layoutIdx}.xml.rels`, `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster${masterIdx}.xml"/>
</Relationships>`);

  zip.file(`ppt/slides/slide${slideIdx}.xml`, `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sld>`);
  zip.file(`ppt/slides/_rels/slide${slideIdx}.xml.rels`, `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout${layoutIdx}.xml"/>
</Relationships>`);

  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
}

const noopCtx = { logger: createNoopLogger(), readZipEntry: async () => { throw new Error('not used'); } };

describe('parsePptxToRawIR id 从 filename digit 解析 (B4)', () => {
  it('连续 1-based filename → master1/theme1/layout1/slide1', async () => {
    const buf = await buildMinimalPptxWithIdx({ masterIdx: 1, themeIdx: 1, layoutIdx: 1, slideIdx: 1 });
    const raw = await parsePptxToRawIR(buf, noopCtx);
    expect(raw.masters[0].id).toBe('master1');
    expect(raw.themes[0].id).toBe('theme1');
    expect(raw.layouts[0].id).toBe('layout1');
    expect(raw.slides[0].id).toBe('slide1');
  });

  it('非连续 filename (master2/theme3/layout5/slide7) → id 跟随 filename digit', async () => {
    const buf = await buildMinimalPptxWithIdx({ masterIdx: 2, themeIdx: 3, layoutIdx: 5, slideIdx: 7 });
    const raw = await parsePptxToRawIR(buf, noopCtx);
    expect(raw.masters[0].id).toBe('master2');
    expect(raw.themes[0].id).toBe('theme3');
    expect(raw.layouts[0].id).toBe('layout5');
    expect(raw.slides[0].id).toBe('slide7');
    // 关键: master.themeRef 应指向 theme3 (从 rels 解), layout.masterRef 指向 master2
    expect(raw.masters[0].themeRef).toBe('theme3');
    expect(raw.layouts[0].masterRef).toBe('master2');
  });
});

describe('parsePptxToRawIR mediaAssets 三层 (Plan 2A D1)', () => {
  it('D1: mediaAssets 收集 slide+layout+master 三层 (含真 image embed)', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);
    zip.file('ppt/presentation.xml', `<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldSz cx="12192000" cy="6858000"/></p:presentation>`);

    // master with image rId
    zip.file('ppt/slideMasters/slideMaster1.xml', `<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree/></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:sldMaster>`);
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
      <Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/master-img.png"/>
    </Relationships>`);
    zip.file('ppt/media/master-img.png', Buffer.from([0x89, 0x50, 0x4E, 0x47]));

    zip.file('ppt/theme/theme1.xml', `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements>
      <a:clrScheme name="x">
        <a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
        <a:dk2><a:srgbClr val="222222"/></a:dk2><a:lt2><a:srgbClr val="EEEEEE"/></a:lt2>
        <a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
        <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4>
        <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6>
        <a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
      </a:clrScheme>
      <a:fontScheme name="x"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
      <a:fmtScheme name="x"/>
    </a:themeElements></a:theme>`);

    // layout with image rId
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`);
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
      <Relationship Id="rId20" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/layout-img.png"/>
    </Relationships>`);
    zip.file('ppt/media/layout-img.png', Buffer.from([0x89, 0x50, 0x4E, 0x47]));

    // slide without image
    zip.file('ppt/slides/slide1.xml', `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sld>`);
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    </Relationships>`);

    const buf = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));
    const raw = await parsePptxToRawIR(buf, noopCtx);
    const kinds = new Set(raw.mediaAssets.map(a => a.ownerKind));
    expect(kinds.has('layout')).toBe(true);
    expect(kinds.has('master')).toBe(true);
    const layoutAsset = raw.mediaAssets.find(a => a.ownerKind === 'layout');
    expect(layoutAsset?.embedId).toBe('rId20');
    const masterAsset = raw.mediaAssets.find(a => a.ownerKind === 'master');
    expect(masterAsset?.embedId).toBe('rId10');
  });
});
