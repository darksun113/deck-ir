import { XMLParser } from 'fast-xml-parser';

export interface RelsEntry {
  id: string;
  type: string;
  target: string;
}

export function parseRels(xml: string): RelsEntry[] {
  if (!xml) return [];
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const list = doc.Relationships?.Relationship ?? [];
  const arr = Array.isArray(list) ? list : [list];
  return arr.map((r: Record<string, string>) => ({
    id: r['@_Id'],
    type: r['@_Type'],
    target: r['@_Target'],
  }));
}

export function resolveThemeIdFromTarget(rels: RelsEntry[]): string {
  const theme = rels.find((r) => r.type.endsWith('/theme'));
  if (!theme) throw new Error('theme rels not found in master');
  // Target 形如 "../theme/theme1.xml" → id "theme1"
  const m = theme.target.match(/theme(\d+)\.xml$/);
  return m ? `theme${m[1]}` : 'theme1';
}
