import type { RuleLogger } from '../../logger/types';

const META = {
  decisionId: '#1',
  ruleName: 'EMU unit conversion',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.1.2',
    mappingDocLine: 39,
    decisionDoc: 'undecided-resolved.md #1',
    officialRef: 'EMU (English Metric Units)',
  },
} as const;

/** EMU → CSS px (96 DPI 假设) */
export function emuToPx(emu: number, logger?: RuleLogger, ctx?: { slideRef?: string; shapeId?: string }): number {
  const px = emu / 9525;
  logger?.apply({
    ...META, context: { element: 'EMU', ...ctx },
    input: { emu }, output: { px },
  });
  return px;
}

export function emuToPt(emu: number): number {
  return emu / 12700;
}

export function emuToInch(emu: number): number {
  return emu / 914400;
}

export function ptToPx(pt: number): number {
  return pt * 4 / 3;
}
