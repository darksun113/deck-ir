import type { RawBackground, RawClrMap, RawColor, RawFill, RawTheme } from '../../ir/raw';
import type { RuleLogger } from '../../logger/types';
import { resolveSchemeColor } from '../colors/scheme-color';
import { resolvePresetColor } from '../colors/preset-color';
import { applyColorModifiers, type ColorModifier } from '../colors/modifiers';
import { resolveBgRef } from '../colors/bg-ref';
import { replacePhClrInFill } from '../colors/ph-color';

const META = {
  decisionId: 'P0-#3',
  ruleName: 'three-layer background merge (slide > layout > master)',
  source: {
    mappingDoc: 'mapping.md 第 1 章 1.6 + 第 7 章',
    mappingDocLine: 0,
    decisionDoc: 'plan-1.1-fix-design § 4 T3',
    officialRef: 'ECMA-376 §19.3.1.40 sld.cSld.bg',
  },
} as const;
void META;  // 占位 provenance, 暂未挂 logger.apply

export interface MergeBgArgs {
  master: RawBackground | null;
  layout: RawBackground | null;
  slide: RawBackground | null;
  theme: RawTheme;
  clrMap: RawClrMap;
}

export interface SemanticBg {
  css: string;
}

export function mergeSlideBackground(args: MergeBgArgs, logger?: RuleLogger): SemanticBg {
  // 覆盖优先: slide > layout > master
  const effective = args.slide ?? args.layout ?? args.master;
  if (!effective) {
    return { css: 'background: #FFFFFF;' };
  }

  // B1: bgRef 命中 → 解 fmtScheme.bgFillStyleLst[idx-1001]
  if (effective.bgRef) {
    const fmtFill = resolveBgRef(effective.bgRef.idx, args.theme);
    if (!fmtFill) {
      logger?.warn({
        decisionId: '#19',
        message: `bgRef idx ${effective.bgRef.idx} 越界, 退化 #FFFFFF`,
        context: { element: 'p:bgRef' },
      });
      return { css: 'background: #FFFFFF;' };
    }
    // B4 预备: phClr 替换 (effective.bgRef.color 是 override color, 来自 <p:bgRef><a:schemeClr>)
    const resolvedFill = effective.bgRef.color
      ? replacePhClrInFill(fmtFill, effective.bgRef.color)
      : fmtFill;
    return { css: fillToCss(resolvedFill, args.theme, args.clrMap, logger) };
  }

  const fill = effective.bgPr?.fill;
  if (!fill) {
    return { css: 'background: #FFFFFF;' };
  }

  return { css: fillToCss(fill, args.theme, args.clrMap, logger) };
}

function fillToCss(fill: RawFill, theme: RawTheme, clrMap: RawClrMap, logger?: RuleLogger): string {
  if (fill.type === 'none') return 'background: transparent;';
  if (fill.type === 'solid' && fill.color) {
    return `background: ${colorToHex(fill.color, theme, clrMap)};`;
  }
  if (fill.type === 'gradient' && fill.gradient?.stops) {
    const stops = fill.gradient.stops
      .map((s) => `${colorToHex(s.color, theme, clrMap)} ${s.pos / 1000}%`)
      .join(', ');
    const angle = fill.gradient.angle ?? 0;
    return `background: linear-gradient(${angle / 60000}deg, ${stops});`;
  }
  if (fill.type === 'blip') {
    logger?.warn({
      decisionId: 'P0-#3',
      message: 'blipFill 背景暂未实现 (Plan 2),退化 transparent',
      context: { element: 'p:bg / a:blipFill' },
    });
    return 'background: transparent;';
  }
  logger?.warn({
    decisionId: 'P0-#3',
    message: `fill type "${fill.type}" 暂未实现,退化 #FFFFFF`,
    context: { element: 'p:bg' },
  });
  return 'background: #FFFFFF;';
}

function colorToHex(c: RawColor, theme: RawTheme, clrMap: RawClrMap): string {
  let baseHex: string;
  if (c.type === 'srgb') baseHex = `#${c.val}`;
  else if (c.type === 'scheme') baseHex = resolveSchemeColor(c.val, clrMap, theme.clrScheme);
  else if (c.type === 'preset') baseHex = resolvePresetColor(c.val) ?? '#000000';
  else baseHex = '#000000';
  // B3: 应用 modifiers (跟 render-pipeline 一致)
  if (c.modifiers && c.modifiers.length > 0) {
    return applyColorModifiers(baseHex, c.modifiers as ColorModifier[]);
  }
  return baseHex;
}
