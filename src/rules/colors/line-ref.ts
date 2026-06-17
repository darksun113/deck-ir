import type { RawOutline, RawTheme } from '../../ir/raw';

const _META = {
  decisionId: '#19',
  ruleName: 'lineRef idx → fmtScheme.lineStyleLst',
  source: {
    mappingDoc: 'mapping.md 第 2 章 2.4',
    mappingDocLine: 0,
    decisionDoc: 'plan-2A-design § 1.2 B3',
    officialRef: 'ECMA-376 §20.1.4.1.18 lnRef',
  },
} as const;

/**
 * lineRef idx → fmtScheme.lineStyleLst[idx-1]
 * (1-based idx)
 */
export function resolveLineRef(idx: number, theme: RawTheme): RawOutline | null {
  const arrIdx = idx - 1;
  const list = theme.fmtScheme.lineStyleLst;
  if (arrIdx < 0 || arrIdx >= list.length) return null;
  return list[arrIdx];
}
