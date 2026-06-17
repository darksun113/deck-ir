const _META = {
  decisionId: '#34',
  ruleName: 'arcTo → SVG A command (5 step geometric derivation)',
  source: {
    mappingDoc: 'mapping.md 第 2 章 2.4.2.b',
    mappingDocLine: 2777,
    decisionDoc: 'undecided-resolved.md #34',
    officialRef: 'documentformat.openxml.drawing.arcto',
  },
} as const;

/**
 * arcTo → SVG `A` 命令 (追踪 #34 完整算法)
 */
export function arcToSvg(
  x0: number, y0: number,
  wR: number, hR: number,
  stAng: number, swAng: number
): { command: string; endPoint: { x: number; y: number } } {
  const cdToRad = Math.PI / (180 * 60000);
  const startRad = stAng * cdToRad;
  const sweepRad = swAng * cdToRad;
  const endRad = startRad + sweepRad;

  const cx = x0 - wR * Math.cos(startRad);
  const cy = y0 - hR * Math.sin(startRad);

  const x1 = parseFloat((cx + wR * Math.cos(endRad)).toFixed(4));
  const y1 = parseFloat((cy + hR * Math.sin(endRad)).toFixed(4));

  const largeArcFlag = Math.abs(swAng) >= 10800000 ? 1 : 0;
  const sweepFlag = swAng > 0 ? 1 : 0;

  return {
    command: `A ${wR} ${hR} 0 ${largeArcFlag} ${sweepFlag} ${x1} ${y1}`,
    endPoint: { x: x1, y: y1 },
  };
}
