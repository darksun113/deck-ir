import type { RawTextRun, RawTheme, RawClrMap, RawColor } from '../../ir/raw';
import { resolveSchemeColor, type ThemeClrScheme } from '../colors/scheme-color';
import { resolvePresetColor } from '../colors/preset-color';
import { applyColorModifiers, type ColorModifier } from '../colors/modifiers';
import { resolveFontSchemeMacro } from './font-scheme';

const _META = {
  decisionId: '#48+#51+#52a',
  ruleName: 'rPr → CSS (font/size/weight/italic/underline/color/strike/baseline)',
  source: {
    mappingDoc: 'mapping.md 第 6 章 6.3+6.4+6.5',
    mappingDocLine: 0,
    decisionDoc: 'plan-2B-design § 1.2 A2.3',
    officialRef: 'ECMA-376 §21.1.2.3 a:rPr',
  },
} as const;
void _META;

type RPr = NonNullable<RawTextRun['rPr']>;

/** RawTextRun.rPr → 内联 CSS 字符串 */
export function runToCss(rPr: RPr, theme: RawTheme, clrMap: RawClrMap): string {
  const parts: string[] = [];

  // font-size: OOXML sz 单位 1/100 pt
  if (typeof rPr.sz === 'number') {
    parts.push(`font-size: ${rPr.sz / 100}pt;`);
  }

  // font-weight
  if (rPr.b) parts.push('font-weight: bold;');

  // font-style
  if (rPr.i) parts.push('font-style: italic;');

  // text-decoration (合并 underline + strike)
  const deco: string[] = [];
  if (rPr.u && rPr.u !== 'none') deco.push('underline');
  if (rPr.strike && rPr.strike !== 'noStrike') deco.push('line-through');
  if (deco.length > 0) parts.push(`text-decoration: ${deco.join(' ')};`);

  // color (含 phClr / modifiers)
  if (rPr.color) {
    const hex = colorToHex(rPr.color, theme, clrMap);
    parts.push(`color: ${hex};`);
  }

  // font-family (CJK 优先: ea > latin > sans-serif fallback)
  const fontParts: string[] = [];
  const resolvedEa = rPr.ea ? resolveFontSchemeMacro(rPr.ea, theme.fontScheme) : undefined;
  const resolvedLatin = rPr.latin ? resolveFontSchemeMacro(rPr.latin, theme.fontScheme) : undefined;
  if (resolvedEa) fontParts.push(`'${resolvedEa}'`);
  if (resolvedLatin) fontParts.push(`'${resolvedLatin}'`);
  if (fontParts.length > 0) {
    parts.push(`font-family: ${fontParts.join(', ')}, sans-serif;`);
  }

  // baseline: 千分比上下标
  if (typeof rPr.baseline === 'number' && rPr.baseline !== 0) {
    if (rPr.baseline > 0) {
      parts.push('vertical-align: super;');
    } else {
      parts.push('vertical-align: sub;');
    }
  }

  return parts.join(' ');
}

function colorToHex(c: RawColor, theme: RawTheme, clrMap: RawClrMap): string {
  let baseHex: string;
  if (c.type === 'srgb') baseHex = `#${c.val}`;
  else if (c.type === 'scheme') baseHex = resolveSchemeColor(c.val, clrMap, theme.clrScheme as unknown as ThemeClrScheme);
  else if (c.type === 'preset') baseHex = resolvePresetColor(c.val) ?? '#000000';
  else baseHex = '#000000';
  if (c.modifiers && c.modifiers.length > 0) {
    return applyColorModifiers(baseHex, c.modifiers as ColorModifier[]);
  }
  return baseHex;
}
