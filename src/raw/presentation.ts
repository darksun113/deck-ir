// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { XMLParser } from 'fast-xml-parser';

export interface PresentationInfo {
  slideSize: { cx_emu: number; cy_emu: number };
}

const DEFAULT_16_9 = { cx_emu: 12192000, cy_emu: 6858000 };

export function parsePresentation(xml: string): PresentationInfo {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const sldSz = doc['p:presentation']?.['p:sldSz'];
  if (!sldSz) return { slideSize: DEFAULT_16_9 };
  const cx = parseInt(String(sldSz['@_cx'] ?? '12192000'), 10);
  const cy = parseInt(String(sldSz['@_cy'] ?? '6858000'), 10);
  return { slideSize: { cx_emu: cx, cy_emu: cy } };
}
