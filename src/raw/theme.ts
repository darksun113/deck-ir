// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { XMLParser } from 'fast-xml-parser';
import type { RawTheme, RawFill, RawOutline } from '../ir/raw';
import { toArray } from './_shared-csld';
import { parseColor } from './element-sp';
import { parseGradFill } from '../rules/colors/gradient-fill';

type ClrSlot = 'dk1' | 'lt1' | 'dk2' | 'lt2' | 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6' | 'hlink' | 'folHlink';

export function parseTheme(id: string, filePath: string, xml: string): RawTheme {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const theme = doc['a:theme'];
  const elem = theme['a:themeElements'];

  // 1. clrScheme — 12 槽位
  const clrSchemeNode = elem['a:clrScheme'];
  const slots: ClrSlot[] = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
  const clrScheme = {} as RawTheme['clrScheme'];
  for (const slot of slots) {
    const node = clrSchemeNode[`a:${slot}`];
    clrScheme[slot] = extractColorHex(node);
  }

  // 2. fontScheme
  const fontSchemeNode = elem['a:fontScheme'];
  const fontScheme = {
    majorLatin: fontSchemeNode['a:majorFont']?.['a:latin']?.['@_typeface'] ?? 'Calibri',
    minorLatin: fontSchemeNode['a:minorFont']?.['a:latin']?.['@_typeface'] ?? 'Calibri',
    majorEa: fontSchemeNode['a:majorFont']?.['a:ea']?.['@_typeface'] ?? '',
    minorEa: fontSchemeNode['a:minorFont']?.['a:ea']?.['@_typeface'] ?? '',
  };

  // 3. fmtScheme: 解 fillStyleLst / lineStyleLst / bgFillStyleLst (T5)
  const fmtSchemeNode = elem['a:fmtScheme'] as Record<string, unknown> | undefined;
  const fmtScheme = {
    fillStyleLst: parseFillList(fmtSchemeNode?.['a:fillStyleLst'] as Record<string, unknown> | undefined),
    lineStyleLst: parseLineList(fmtSchemeNode?.['a:lnStyleLst'] as Record<string, unknown> | undefined),
    bgFillStyleLst: parseFillList(fmtSchemeNode?.['a:bgFillStyleLst'] as Record<string, unknown> | undefined),
  };

  return { id, filePath, clrScheme, fontScheme, fmtScheme };
}

function parseFillList(node: Record<string, unknown> | undefined): RawFill[] {
  if (!node) return [];
  const out: RawFill[] = [];
  for (const sf of toArray(node['a:solidFill'])) {
    const color = parseColor(sf as Record<string, unknown>);
    out.push({ type: 'solid', color });
  }
  for (const gf of toArray(node['a:gradFill'])) {
    out.push(parseGradFill(gf as Record<string, unknown>));    // C1
  }
  for (const _bf of toArray(node['a:blipFill'])) {
    out.push({ type: 'blip', blipRef: {} });  // 占位; embed 没 rels 上下文
  }
  return out;
}

function parseLineList(node: Record<string, unknown> | undefined): RawOutline[] {
  if (!node) return [];
  return toArray(node['a:ln']).map((ln) => {
    const lnNode = ln as Record<string, unknown>;
    const solid = lnNode['a:solidFill'] as Record<string, unknown> | undefined;
    return {
      width: parseInt(String(lnNode['@_w'] ?? '0'), 10) || undefined,
      color: solid ? parseColor(solid) : undefined,
    };
  });
}

type ColorRefNode = {
  'a:srgbClr'?: { '@_val'?: string };
  'a:sysClr'?: { '@_lastClr'?: string };
};

function extractColorHex(node: ColorRefNode | undefined | null): string {
  if (!node) return '#000000';
  if (node['a:srgbClr']) return '#' + String(node['a:srgbClr']['@_val']).toUpperCase();
  if (node['a:sysClr']) return '#' + String(node['a:sysClr']['@_lastClr'] ?? '000000').toUpperCase();
  return '#000000';
}
