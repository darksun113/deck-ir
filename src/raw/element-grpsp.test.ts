import { describe, it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { parseGroupShape } from './element-grpsp';

const noop = { apply() {}, warn() {}, error() {} } as never;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

describe('parseGroupShape', () => {
  it('提取 grpSp 含 2 个 sp 子元素', () => {
    const xml = `<p:grpSp xmlns:p="x" xmlns:a="y" xmlns:r="z">
      <p:nvGrpSpPr><p:cNvPr id="10" name="Group 1"/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="100" cy="100"/></a:xfrm></p:grpSpPr>
      <p:sp><p:nvSpPr><p:cNvPr id="11" name="A"/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>
      <p:sp><p:nvSpPr><p:cNvPr id="12" name="B"/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>
    </p:grpSp>`;
    const result = parseGroupShape(parser.parse(xml)['p:grpSp'], { mediaRefs: {} });
    expect(result.kind).toBe('grpSp');
    expect(result.id).toBe('10');
    expect(result.children).toHaveLength(2);
    expect(result.children[0].kind).toBe('sp');
    expect(result.children[0].id).toBe('11');
  });

  it('递归 grpSp 内嵌 grpSp', () => {
    const xml = `<p:grpSp xmlns:p="x" xmlns:a="y" xmlns:r="z">
      <p:nvGrpSpPr><p:cNvPr id="20" name="Outer"/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:grpSp>
        <p:nvGrpSpPr><p:cNvPr id="21" name="Inner"/></p:nvGrpSpPr>
        <p:grpSpPr/>
        <p:sp><p:nvSpPr><p:cNvPr id="22" name="X"/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>
      </p:grpSp>
    </p:grpSp>`;
    const result = parseGroupShape(parser.parse(xml)['p:grpSp'], { mediaRefs: {} });
    expect(result.children).toHaveLength(1);
    const inner = result.children[0];
    expect(inner.kind).toBe('grpSp');
    if (inner.kind === 'grpSp') {
      expect(inner.children).toHaveLength(1);
      expect(inner.children[0].id).toBe('22');
    }
  });
});

describe('parseGrpChildren — 组内 cxnSp + z-order(2D 补漏)', () => {
  it('组内 p:cxnSp 被解析(不再丢)', () => {
    const grp = {
      'p:nvGrpSpPr': { 'p:cNvPr': { '@_id': '100', '@_name': 'grp' } },
      'p:cxnSp': { 'p:nvCxnSpPr': { 'p:cNvPr': { '@_id': '101' } }, 'p:spPr': { 'a:prstGeom': { '@_prst': 'line' } } },
    };
    const g = parseGroupShape(grp as never, { mediaRefs: {}, logger: noop, slideRef: 's1' } as never);
    expect(g.children.some((c) => c.id === '101')).toBe(true); // cxnSp 进了 children
  });

  it('组内子元素按 ctx.orderIndex 文档序排序', () => {
    const grp = {
      'p:nvGrpSpPr': { 'p:cNvPr': { '@_id': '100' } },
      'p:sp': { 'p:nvSpPr': { 'p:cNvPr': { '@_id': '20' } }, 'p:spPr': {} },
      'p:pic': { 'p:nvPicPr': { 'p:cNvPr': { '@_id': '10' } }, 'p:spPr': {} },
    };
    // orderIndex 说 pic(10) 在 sp(20) 之前 → 排序后 children 顺序应为 [10, 20]
    const orderIndex = new Map([['10', 0], ['20', 1]]);
    const g = parseGroupShape(grp as never, { mediaRefs: {}, logger: noop, slideRef: 's1', orderIndex } as never);
    expect(g.children.map((c) => c.id)).toEqual(['10', '20']);
  });
});
