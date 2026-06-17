// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

const _META_ANGLE = {
  decisionId: '#2',
  ruleName: 'ST_Angle 1/60000° (Microsoft typo 1/64000 已修正)',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.1.5',
    mappingDocLine: 81,
    decisionDoc: 'undecided-resolved.md #2',
    officialRef: 'dotnetCampus Angle.cs Precision=60000.0',
  },
} as const;

export function ooxmlAngleToDeg(angle: number): number {
  return angle / 60000;
}
