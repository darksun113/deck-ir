import type { RawFill, RawTheme } from '../../ir/raw';

const _META = {
  decisionId: '#19',
  ruleName: 'fillRef idx → fmtScheme.fillStyleLst',
  source: {
    mappingDoc: 'mapping.md 第 2 章 2.4',
    mappingDocLine: 0,
    decisionDoc: 'plan-2A-design § 1.2 B2',
    officialRef: 'ECMA-376 §20.1.4.1.10 fillRef',
  },
} as const;

/**
 * fillRef idx → fmtScheme.fillStyleLst[idx-1]
 * (OOXML fillRef idx 是 1-based for fillStyleLst)
 */
export function resolveFillRef(idx: number, theme: RawTheme): RawFill | null {
  const arrIdx = idx - 1;
  const list = theme.fmtScheme.fillStyleLst;
  if (arrIdx < 0 || arrIdx >= list.length) return null;
  return list[arrIdx];
}
