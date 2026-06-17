import { XMLParser } from 'fast-xml-parser';
import type { RawMaster, RawClrMap } from '../ir/raw';
import type { RuleLogger } from '../logger/types';
import { parseCSld } from './_shared-csld';
import { parseRels, resolveThemeIdFromTarget } from './_shared-rels';
import { buildZOrderIndex } from './z-order';
import { buildCustGeomPaths } from './cust-geom-paths';

export function parseSlideMaster(
  id: string,
  filePath: string,
  xml: string,
  relsXml: string,
  logger?: RuleLogger,
): RawMaster {
  // A1.1: stopNodes 让 p:txBody 进 element-sp 时是原始 inner XML 字符串
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', allowBooleanAttributes: true, stopNodes: ['*.p:txBody'] });
  const doc = parser.parse(xml);
  const sldMaster = doc['p:sldMaster'];

  // 1. clrMap
  const clrMapNode = sldMaster['p:clrMap'] ?? {};
  const clrMap: RawClrMap = {
    bg1: clrMapNode['@_bg1'], tx1: clrMapNode['@_tx1'],
    bg2: clrMapNode['@_bg2'], tx2: clrMapNode['@_tx2'],
    accent1: clrMapNode['@_accent1'], accent2: clrMapNode['@_accent2'],
    accent3: clrMapNode['@_accent3'], accent4: clrMapNode['@_accent4'],
    accent5: clrMapNode['@_accent5'], accent6: clrMapNode['@_accent6'],
    hlink: clrMapNode['@_hlink'], folHlink: clrMapNode['@_folHlink'],
  };

  // 2. rels + mediaRefs (从 rels 解析, parseCSld 需要 PictureCtx)
  const rels = parseRels(relsXml);
  const mediaRefs: Record<string, string> = {};
  for (const r of rels) {
    if (r.type.endsWith('/image')) {
      mediaRefs[r.id] = r.target.replace(/^\.\./, '/ppt');
    }
  }

  // 3. cSld 用 mediaRefs 作 PictureCtx; orderIndex 恢复文档序 z-order (2D-A)
  const orderIndex = buildZOrderIndex(xml);
  const custGeomPaths = buildCustGeomPaths(xml);
  const cSld = parseCSld(sldMaster['p:cSld'], { mediaRefs, logger, slideRef: id, orderIndex, custGeomPaths });

  // 4. themeRef (从 rels 解析)
  const themeRef = resolveThemeIdFromTarget(rels);

  // 5. showMasterSp 默认 true (追踪 #22 master 层默认)
  const showMasterSp = sldMaster['@_showMasterSp'] === '0' ? false : true;

  return { id, filePath, cSld, clrMap, themeRef, showMasterSp, mediaRefs };
}
