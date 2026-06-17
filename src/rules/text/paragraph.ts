import { emuToPx } from '../units/emu';

const _META = {
  decisionId: '#49',
  ruleName: 'algn 7 values Gemini CSS Text L3 三属性组合',
  source: {
    mappingDoc: 'mapping.md 第 6 章 6.5.3',
    mappingDocLine: 5049,
    decisionDoc: 'undecided-resolved.md #49',
    officialRef: 'CSS Text Module L3 (text-align + text-align-last + text-justify)',
  },
} as const;

/** algn 7 值的精确组合映射 (追踪 #49 Gemini 推荐) */
export function algnToCss(algn?: string): string {
  switch (algn) {
    case 'l': return 'text-align: left;';
    case 'ctr': return 'text-align: center;';
    case 'r': return 'text-align: right;';
    case 'just': return 'text-align: justify;';
    case 'dist': return 'text-align: justify; text-align-last: justify;';
    case 'justLow': return 'text-align: justify; text-justify: inter-word;';
    case 'thaiDist': return 'text-align: justify; text-align-last: justify; text-justify: inter-character;';
    default: return 'text-align: left;';
  }
}

/** A2.2: 段落属性 → CSS (marL / indent / lnSpc 组合) */
export function paragraphPropsToCss(
  pPr?: { marL?: number; indent?: number; lnSpc?: { pct?: number; pts?: number } }
): string {
  if (!pPr) return '';
  const parts: string[] = [];
  if (typeof pPr.marL === 'number') {
    parts.push(`margin-left: ${emuToPx(pPr.marL)}px;`);
  }
  if (typeof pPr.indent === 'number') {
    parts.push(`text-indent: ${emuToPx(pPr.indent)}px;`);
  }
  if (pPr.lnSpc?.pct !== undefined) {
    parts.push(`line-height: ${pPr.lnSpc.pct / 100000};`);
  } else if (pPr.lnSpc?.pts !== undefined) {
    // lnSpc.pts 单位 1/100 pt
    parts.push(`line-height: ${pPr.lnSpc.pts / 100}pt;`);
  }
  return parts.join(' ');
}
