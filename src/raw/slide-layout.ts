import { XMLParser } from 'fast-xml-parser';
import type { RawLayout, RawClrMap } from '../ir/raw';
import type { RuleLogger } from '../logger/types';
import { parseCSld } from './_shared-csld';
import { parseRels } from './_shared-rels';
import { buildZOrderIndex } from './z-order';
import { buildCustGeomPaths } from './cust-geom-paths';

export function parseSlideLayout(
  id: string,
  filePath: string,
  xml: string,
  relsXml: string,
  logger?: RuleLogger,
): RawLayout {
  // A1.1: stopNodes 让 p:txBody 进 element-sp 时是原始 inner XML 字符串
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', stopNodes: ['*.p:txBody'] });
  const doc = parser.parse(xml);
  const sldLayout = doc['p:sldLayout'];

  const type = sldLayout['@_type'];

  // showMasterSp: "1"=true, "0"=false, 未指定=null (追踪 #22)
  const rawShow = sldLayout['@_showMasterSp'];
  const showMasterSp = rawShow === undefined ? null : (rawShow === '1' || rawShow === 'true');

  // masterRef + mediaRefs (从 rels 解析)
  const rels = parseRels(relsXml);
  const mediaRefs: Record<string, string> = {};
  for (const r of rels) {
    if (r.type.endsWith('/image')) {
      mediaRefs[r.id] = r.target.replace(/^\.\./, '/ppt');
    }
  }

  // cSld 用 mediaRefs 作 PictureCtx; orderIndex 恢复文档序 z-order (2D-A)
  const orderIndex = buildZOrderIndex(xml);
  const custGeomPaths = buildCustGeomPaths(xml);
  const cSld = parseCSld(sldLayout['p:cSld'], { mediaRefs, logger, slideRef: id, orderIndex, custGeomPaths });

  const masterRel = rels.find((r) => r.type.endsWith('/slideMaster'));
  if (!masterRel) throw new Error(`layout ${id} 无 slideMaster rels`);
  const masterRef = (masterRel.target.match(/slideMaster(\d+)\.xml$/)?.[1] ?? '1');

  return {
    id, filePath, cSld,
    masterRef: `master${masterRef}`,
    clrMapOvr: parseClrMapOvr(sldLayout['p:clrMapOvr']),
    showMasterSp, type,
    mediaRefs,        // D1
  };
}

function parseClrMapOvr(node: Record<string, unknown> | undefined): RawClrMap | null {
  if (!node) return null;
  const override = node['a:overrideClrMapping'] as Record<string, unknown> | undefined;
  if (!override) return null;  // masterClrMapping 表示沿用 master, 不是覆盖
  const get = (k: string): string => String(override[`@_${k}`] ?? k);
  return {
    bg1: get('bg1'), tx1: get('tx1'), bg2: get('bg2'), tx2: get('tx2'),
    accent1: get('accent1'), accent2: get('accent2'), accent3: get('accent3'),
    accent4: get('accent4'), accent5: get('accent5'), accent6: get('accent6'),
    hlink: get('hlink'), folHlink: get('folHlink'),
  };
}
