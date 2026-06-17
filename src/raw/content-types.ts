// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { XMLParser } from 'fast-xml-parser';

export interface ContentTypesResult {
  masterParts: string[];
  layoutParts: string[];
  slideParts: string[];
  themeParts: string[];
  presentationPart: string | null;
}

const SLIDE_MASTER_CT = 'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml';
const SLIDE_LAYOUT_CT = 'application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml';
const SLIDE_CT = 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml';
const THEME_CT = 'application/vnd.openxmlformats-officedocument.theme+xml';
const PRESENTATION_CT = 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml';

export function parseContentTypes(xml: string): ContentTypesResult {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const overrides = doc.Types?.Override ?? [];
  const list = Array.isArray(overrides) ? overrides : [overrides];

  const result: ContentTypesResult = {
    masterParts: [],
    layoutParts: [],
    slideParts: [],
    themeParts: [],
    presentationPart: null,
  };

  for (const ov of list) {
    const ct = ov['@_ContentType'];
    const part = ov['@_PartName'];
    if (!ct || !part) continue;
    if (ct === SLIDE_MASTER_CT) result.masterParts.push(part);
    else if (ct === SLIDE_LAYOUT_CT) result.layoutParts.push(part);
    else if (ct === SLIDE_CT) result.slideParts.push(part);
    else if (ct === THEME_CT) result.themeParts.push(part);
    else if (ct === PRESENTATION_CT) result.presentationPart = part;
  }

  // 按文件名后缀数字排序
  const numSort = (a: string, b: string) => {
    const ai = parseInt(a.match(/(\d+)\.xml$/)?.[1] ?? '0', 10);
    const bi = parseInt(b.match(/(\d+)\.xml$/)?.[1] ?? '0', 10);
    return ai - bi;
  };
  result.masterParts.sort(numSort);
  result.layoutParts.sort(numSort);
  result.slideParts.sort(numSort);
  result.themeParts.sort(numSort);

  return result;
}
