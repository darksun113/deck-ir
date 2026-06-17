import type { RawCustPath } from '../../ir/raw';
import { arcToSvg } from './arc-to';

const _META = {
  decisionId: '#34',
  ruleName: 'custGeom path → SVG d',
  source: {
    mappingDoc: 'mapping.md 第 2 章 2.4.2',
    mappingDocLine: 2598,
    decisionDoc: 'undecided-resolved.md #34',
    officialRef: 'documentformat.openxml.drawing.customgeometry',
  },
} as const;

/** custGeom path → SVG d 字符串 + viewBox */
export function custGeomToSvgPath(path: RawCustPath): { d: string; viewBox: string } {
  let x = 0, y = 0;
  const parts: string[] = [];
  for (const cmd of path.commands) {
    switch (cmd.type) {
      case 'moveTo':
        parts.push(`M ${cmd.x} ${cmd.y}`); x = cmd.x; y = cmd.y; break;
      case 'lnTo':
        parts.push(`L ${cmd.x} ${cmd.y}`); x = cmd.x; y = cmd.y; break;
      case 'cubicBezTo':
        if (cmd.pts.length >= 3) {
          parts.push(`C ${cmd.pts[0].x} ${cmd.pts[0].y} ${cmd.pts[1].x} ${cmd.pts[1].y} ${cmd.pts[2].x} ${cmd.pts[2].y}`);
          x = cmd.pts[2].x; y = cmd.pts[2].y;
        }
        break;
      case 'quadBezTo':
        if (cmd.pts.length >= 2) {
          parts.push(`Q ${cmd.pts[0].x} ${cmd.pts[0].y} ${cmd.pts[1].x} ${cmd.pts[1].y}`);
          x = cmd.pts[1].x; y = cmd.pts[1].y;
        }
        break;
      case 'arcTo': {
        const r = arcToSvg(x, y, cmd.wR, cmd.hR, cmd.stAng, cmd.swAng);
        parts.push(r.command); x = r.endPoint.x; y = r.endPoint.y;
        break;
      }
      case 'close':
        parts.push('Z'); break;
    }
  }
  return { d: parts.join(' '), viewBox: `0 0 ${path.w} ${path.h}` };
}
