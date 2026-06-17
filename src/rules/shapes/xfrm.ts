import { emuToPx } from '../units/emu';
import { ooxmlAngleToDeg } from '../units/angle';
import type { RawXfrm } from '../../ir/raw';

const _META = {
  decisionId: '#8',
  ruleName: 'xfrm 先 flip 后 rot (M_translate × M_rotate × M_flip)',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.3.4 + 第 2 章 2.3.2',
    mappingDocLine: 454,
    decisionDoc: 'undecided-resolved.md #8 / #28-30 / #52c',
    officialRef: 'MS Learn ms-oe376 PPT + 仿射矩阵约定',
  },
} as const;

export interface SemanticXfrm {
  bbox: { x: number; y: number; w: number; h: number };  // px
  transform: string;
}

export function applyXfrm(raw: RawXfrm | undefined): SemanticXfrm {
  if (!raw || !raw.off || !raw.ext) {
    return { bbox: { x: 0, y: 0, w: 0, h: 0 }, transform: '' };
  }
  const bbox = {
    x: emuToPx(raw.off.x), y: emuToPx(raw.off.y),
    w: emuToPx(raw.ext.cx), h: emuToPx(raw.ext.cy),
  };
  const parts: string[] = [];
  if (raw.rot) parts.push(`rotate(${ooxmlAngleToDeg(raw.rot)}deg)`);
  if (raw.flipH) parts.push('scaleX(-1)');
  if (raw.flipV) parts.push('scaleY(-1)');
  // CSS transform 右到左应用: scale 先生效, rotate 后生效 → 对齐 OOXML 矩阵顺序
  return { bbox, transform: parts.join(' ') };
}
