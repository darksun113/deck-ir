// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RuleLogger } from '../../logger/types';

const _META_3D = {
  decisionId: '#58',
  ruleName: '3D permanent skip (degrade to 2D)',
  source: {
    mappingDoc: 'mapping.md 第 10 章 10.4',
    mappingDocLine: 6993,
    decisionDoc: 'undecided-resolved.md #58',
    officialRef: 'documentformat.openxml.drawing.scene3dtype + shape3dtype',
  },
} as const;

export function skip3DEffects(logger?: RuleLogger, ctx?: { slideRef?: string; shapeId?: string }): void {
  logger?.warn({ decisionId: '#58',
    message: 'a:scene3d / a:sp3d 已 skip,按 2D 渲染 (CSS 3D 无法精确还原)',
    context: { element: 'a:scene3d', ...ctx } });
}
