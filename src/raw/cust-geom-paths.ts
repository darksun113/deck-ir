// 修#2: custGeom 自定义图形路径解析。路径命令(moveTo/lnTo/cubicBezTo…)交错出现、顺序攸关,
// fast-xml-parser 默认按 tag 分组会丢顺序 → 用 preserveOrder 单独解析一遍(同 z-order 思路),
// 按 shape id 提取有序命令。供 element-sp 查表填 raw.geom.custPath,再由 custGeomToSvgPath 转 SVG。
import { XMLParser } from 'fast-xml-parser';
import type { RawCustPath } from '../ir/raw';

const _parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', preserveOrder: true });

type ON = Record<string, unknown>;
const kids = (n: ON | undefined, tag: string): ON[] => (n && Array.isArray(n[tag]) ? (n[tag] as ON[]) : []);
const find = (arr: ON[], tag: string): ON | undefined => arr.find((c) => tag in c);
const at = (n: ON | undefined): Record<string, string> => ((n?.[':@'] as Record<string, string>) ?? {});
const num = (v: string | undefined): number => { const x = parseInt(String(v ?? '0'), 10); return Number.isFinite(x) ? x : 0; };
const ptsOf = (cmd: ON, tag: string): Array<{ x: number; y: number }> =>
  kids(cmd, tag).filter((c) => 'a:pt' in c).map((c) => { const a = at(c); return { x: num(a['@_x']), y: num(a['@_y']) }; });

function parsePath(pathNode: ON): RawCustPath | null {
  const a = at(pathNode);
  const w = num(a['@_w']), h = num(a['@_h']);
  if (w <= 0 || h <= 0) return null;
  const commands: RawCustPath['commands'] = [];
  for (const cmd of kids(pathNode, 'a:path')) {
    const key = Object.keys(cmd).find((k) => k !== ':@');
    if (!key) continue;
    const pts = ptsOf(cmd, key);
    const ca = at(cmd);
    switch (key) {
      case 'a:moveTo': if (pts[0]) commands.push({ type: 'moveTo', x: pts[0].x, y: pts[0].y }); break;
      case 'a:lnTo': if (pts[0]) commands.push({ type: 'lnTo', x: pts[0].x, y: pts[0].y }); break;
      case 'a:cubicBezTo': if (pts.length >= 3) commands.push({ type: 'cubicBezTo', pts }); break;
      case 'a:quadBezTo': if (pts.length >= 2) commands.push({ type: 'quadBezTo', pts }); break;
      case 'a:arcTo': commands.push({ type: 'arcTo', wR: num(ca['@_wR']), hR: num(ca['@_hR']), stAng: num(ca['@_stAng']), swAng: num(ca['@_swAng']) }); break;
      case 'a:close': commands.push({ type: 'close' }); break;
    }
  }
  return commands.length > 0 ? { w, h, commands } : null;
}

/** preserveOrder 解析 XML → 每个含 custGeom 的 shape id → RawCustPath(命令按真实顺序)。 */
export function buildCustGeomPaths(xml: string): Map<string, RawCustPath> {
  const map = new Map<string, RawCustPath>();
  let doc: ON[];
  try { doc = _parser.parse(xml) as ON[]; } catch { return map; }

  const walk = (nodes: ON[]): void => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const spKids = kids(node, 'p:sp');
      if (spKids.length) {
        const nvSpPr = find(spKids, 'p:nvSpPr');
        const cNvPr = nvSpPr ? find(kids(nvSpPr, 'p:nvSpPr'), 'p:cNvPr') : undefined;
        const id = cNvPr ? at(cNvPr)['@_id'] : undefined;
        const spPr = find(spKids, 'p:spPr');
        const custGeom = spPr ? find(kids(spPr, 'p:spPr'), 'a:custGeom') : undefined;
        const pathLst = custGeom ? find(kids(custGeom, 'a:custGeom'), 'a:pathLst') : undefined;
        const pathNode = pathLst ? find(kids(pathLst, 'a:pathLst'), 'a:path') : undefined;
        if (id && pathNode) {
          const cp = parsePath(pathNode);
          if (cp) map.set(id, cp);
        }
      }
      for (const key of Object.keys(node)) {
        if (key === ':@') continue;
        const v = node[key];
        if (Array.isArray(v)) walk(v as ON[]);
      }
    }
  };
  walk(doc);
  return map;
}
