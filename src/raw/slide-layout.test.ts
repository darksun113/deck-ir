import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseSlideLayout } from './slide-layout';

describe('parseSlideLayout', () => {
  it('解析 type + showMasterSp + masterRef', () => {
    const xml = readFileSync(path.join(__dirname, '../../../../../../tests/integration/fixtures/phase-a/minimal-layout.xml'), 'utf8');
    const rels = readFileSync(path.join(__dirname, '../../../../../../tests/integration/fixtures/phase-a/minimal-layout.xml.rels'), 'utf8');
    const layout = parseSlideLayout('layout1', '/ppt/slideLayouts/slideLayout1.xml', xml, rels);
    expect(layout.type).toBe('title');
    expect(layout.showMasterSp).toBe(false);  // "0" → false
    expect(layout.masterRef).toBe('master1');
  });

  it('未指定 showMasterSp 时为 null (供覆盖优先模型判断)', () => {
    const xml = `<?xml version="1.0"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`;
    const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
    const layout = parseSlideLayout('layout1', 'x.xml', xml, rels);
    expect(layout.showMasterSp).toBeNull();
  });
});

describe('parseSlideLayout - clrMapOvr (T6)', () => {
  it('layout 含 a:overrideClrMapping → 解析出 12 槽位映射', () => {
    const xml = `<p:sldLayout xmlns:p="x" xmlns:a="y">
      <p:cSld><p:spTree/></p:cSld>
      <p:clrMapOvr>
        <a:overrideClrMapping bg1="lt2" tx1="dk2" bg2="lt1" tx2="dk1"
          accent1="accent2" accent2="accent1" accent3="accent3"
          accent4="accent4" accent5="accent5" accent6="accent6"
          hlink="hlink" folHlink="folHlink"/>
      </p:clrMapOvr>
    </p:sldLayout>`;
    const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
    </Relationships>`;
    const result = parseSlideLayout('l1', '/ppt/slideLayouts/slideLayout1.xml', xml, rels);
    expect(result.clrMapOvr).not.toBeNull();
    expect(result.clrMapOvr?.bg1).toBe('lt2');
    expect(result.clrMapOvr?.accent1).toBe('accent2');
  });

  it('layout 无 clrMapOvr → 字段 null', () => {
    const xml = `<p:sldLayout xmlns:p="x"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`;
    const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
    </Relationships>`;
    const result = parseSlideLayout('l1', '/ppt/slideLayouts/slideLayout1.xml', xml, rels);
    expect(result.clrMapOvr).toBeNull();
  });

  it('layout 含 p:clrMapOvr 但只有 a:masterClrMapping(不 override) → null', () => {
    const xml = `<p:sldLayout xmlns:p="x" xmlns:a="y">
      <p:cSld><p:spTree/></p:cSld>
      <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
    </p:sldLayout>`;
    const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
    </Relationships>`;
    const result = parseSlideLayout('l1', '/ppt/slideLayouts/slideLayout1.xml', xml, rels);
    expect(result.clrMapOvr).toBeNull();
  });
});
