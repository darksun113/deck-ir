// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { ooxmlPercentageToDecimal } from '../units/percentage';

const _META = {
  decisionId: '#7',
  ruleName: 'color modifiers in XML order',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.2.5',
    mappingDocLine: 390,
    decisionDoc: 'undecided-resolved.md #7',
    officialRef: 'Stack Overflow 19886180 Lerp formula',
  },
} as const;

export interface ColorModifier {
  name: 'lumMod' | 'lumOff' | 'satMod' | 'satOff' | 'hueMod' | 'hueOff' | 'tint' | 'shade' | 'alpha';
  val: number;  // 1/1000% (100000 = 100%)
}

/** HSL { h: 0-360, s: 0-1, l: 0-1 } */
interface HSL { h: number; s: number; l: number; a: number }

function hexToHsl(hex: string): HSL {
  const m = hex.replace('#', '').match(/.{2}/g)!;
  const [r, g, b] = m.map((c) => parseInt(c, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l, a: 1 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
    case g: h = ((b - r) / d + 2) * 60; break;
    default: h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l, a: 1 };
}

function hslToHex({ h, s, l }: HSL): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0').toUpperCase();
  return '#' + toHex(r1) + toHex(g1) + toHex(b1);
}

/**
 * 按 XML 出现顺序逐个应用修饰符 (追踪 #7)
 * 例: <lumMod val="60000"/><lumOff val="40000"/> → 先 ×60% 后 +40% (中文淡化 40%)
 */
export function applyColorModifiers(baseHex: string, mods: ColorModifier[]): string {
  const hsl = hexToHsl(baseHex);
  for (const mod of mods) {
    const pct = ooxmlPercentageToDecimal(mod.val);
    switch (mod.name) {
      case 'lumMod': hsl.l = hsl.l * pct; break;
      case 'lumOff': hsl.l = Math.min(1, hsl.l + pct); break;
      case 'satMod': hsl.s = hsl.s * pct; break;
      case 'satOff': hsl.s = Math.min(1, hsl.s + pct); break;
      case 'tint':   hsl.l = hsl.l + (1 - hsl.l) * pct; break;  // toward white
      case 'shade':  hsl.l = hsl.l * pct; break;                 // toward black
      case 'alpha':  hsl.a = pct; break;
      // hueMod / hueOff 略 (MVP 不必)
    }
  }
  return hslToHex(hsl);
}
