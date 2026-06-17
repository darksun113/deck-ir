import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseSlideMaster } from './slide-master';

describe('parseSlideMaster', () => {
  it('解析 clrMap 12 属性 + spTree + themeRef', () => {
    const xml = readFileSync(path.join(__dirname, '../../tests/integration/fixtures/phase-a/minimal-master.xml'), 'utf8');
    const rels = readFileSync(path.join(__dirname, '../../tests/integration/fixtures/phase-a/minimal-master.xml.rels'), 'utf8');
    const master = parseSlideMaster('master1', '/ppt/slideMasters/slideMaster1.xml', xml, rels);
    expect(master.clrMap.bg1).toBe('lt1');
    expect(master.clrMap.folHlink).toBe('folHlink');
    expect(master.themeRef).toBe('theme1');
    expect(master.cSld.bg?.bgRef?.idx).toBe(1001);
    expect(master.showMasterSp).toBe(true); // 默认
  });
});
