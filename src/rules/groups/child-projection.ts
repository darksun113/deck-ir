// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RuleLogger } from '../../logger/types';

const META = {
  decisionId: '#9+#10',
  ruleName: 'grpSp chOff/chExt child projection',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.4 + 第 7 章 7.4',
    mappingDocLine: 497,
    decisionDoc: 'undecided-resolved.md #9 + #10',
    officialRef: 'documentformat.openxml.drawing.transformgroup',
  },
} as const;

export interface GroupGeom {
  off: { x: number; y: number };          // EMU
  ext: { cx: number; cy: number };
  chOff: { x: number; y: number };
  chExt: { cx: number; cy: number };
}

export interface ChildGeom {
  off: { x: number; y: number };          // EMU,在 chOff 坐标系下
  ext: { cx: number; cy: number };
}

/** chOff/chExt 投影: 把 child 在内坐标系的几何投到外层坐标系 (追踪 #9+#10) */
export function projectChildInGroup(
  group: GroupGeom,
  child: ChildGeom,
  logger?: RuleLogger,
  ctx?: { slideRef?: string; shapeId?: string }
): { x: number; y: number; w: number; h: number } {
  // 边界保护: chExt=0 时分母替换为 1 (追踪 #9 边界保护)
  const chCx = group.chExt.cx || 1;
  const chCy = group.chExt.cy || 1;
  const sx = group.ext.cx / chCx;
  const sy = group.ext.cy / chCy;
  const result = {
    x: group.off.x + (child.off.x - group.chOff.x) * sx,
    y: group.off.y + (child.off.y - group.chOff.y) * sy,
    w: child.ext.cx * sx,
    h: child.ext.cy * sy,
  };
  logger?.apply({
    ...META, context: { element: 'p:grpSp', ...ctx },
    input: { group, child }, output: result,
  });
  return result;
}
