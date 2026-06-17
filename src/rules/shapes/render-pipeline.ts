import type { RawShape, RawTheme, RawClrMap, RawColor, RawFill, RawOutline } from '../../ir/raw';
import type { SemanticShape } from '../../ir/semantic';
import { applyXfrm } from './xfrm';
import { resolvePrstGeom } from './prst-geom-table';
import { custGeomToSvgPath } from './cust-geom';
import { applyUseBgFill } from './use-bg-fill';
import { resolveSchemeColor } from '../colors/scheme-color';
import { resolvePresetColor } from '../colors/preset-color';
import { applyColorModifiers, type ColorModifier } from '../colors/modifiers';
import { resolveFillRef } from '../colors/fill-ref';
import { resolveLineRef } from '../colors/line-ref';
import { replacePhClrInFill } from '../colors/ph-color';
import type { RuleLogger } from '../../logger/types';

export interface SlideBackgroundInput {
  cssBackground: string;
  w: number;
  h: number;
}

const META = {
  decisionId: '#35',
  ruleName: 'spPr 6-step painter pipeline',
  source: {
    mappingDoc: 'mapping.md 第 -1 章 -1.3.4 + 第 2 章 2.5',
    mappingDocLine: 2876,
    decisionDoc: 'undecided-resolved.md #35',
    officialRef: 'Gemini 多源汇总(画家算法 + SVG 渲染管线)',
  },
} as const;

/**
 * 6 步渲染管线 (追踪 #35,完全打破 XML schema 顺序):
 * 1) xfrm 坐标系 → 2) prstGeom/custGeom 几何 → 3) 底层特效(MVP 不做)
 * 4) fill (MVP 仅 solidFill) → 5) stroke (MVP 仅 solidFill 边框) → 6) 上层特效(MVP 不做)
 */
export function renderShape(
  raw: RawShape,
  theme: RawTheme,
  clrMap: RawClrMap,
  slideBackground: SlideBackgroundInput,
  logger?: RuleLogger,
  ctx?: { slideRef?: string }
): SemanticShape {
  const shapeCtx = { ...ctx, shapeId: raw.id };

  // Step 1: xfrm
  const xfrm = applyXfrm(raw.xfrm);

  // Step 2: geometry
  let geometry: SemanticShape['geometry'] = { type: 'div' };
  if (raw.geom?.prst) {
    const prst = resolvePrstGeom(raw.geom.prst, xfrm.bbox, raw.geom.avLst, logger, shapeCtx);
    // 修#1:之前 div 分支重建成 { type:'div' } 把 cssRadius 丢了 → ellipse/roundRect 变方/直角。
    // 直接透传 prst.geometry 保住 cssRadius(border-radius)。
    geometry = prst.geometry;
  } else if (raw.geom?.custPath) {
    const cust = custGeomToSvgPath(raw.geom.custPath);
    geometry = { type: 'svg-path', d: cust.d, viewBox: cust.viewBox };
  }

  // Step 4-5: fill / outline 简化(MVP solidFill only, 详细 fill 解析交给 adapter / Plan 2)
  // W1: useBgFill=true 时, 用 applyUseBgFill 覆盖 solidFill 路径 (追踪 #23)
  let fill: SemanticShape['fill'] = null;
  if (raw.useBgFill) {
    const useBgResult = applyUseBgFill(
      { shape: xfrm.bbox, slideBackground },
      logger,
      shapeCtx,
    );
    fill = { css: useBgResult.css };
  } else {
    // B2: fillRef 优先 → 解 fmtScheme.fillStyleLst[idx-1]
    let effectiveFill: RawFill | undefined = raw.fill;
    if (raw.styleRef?.fillRef && !effectiveFill) {
      const fmtFill = resolveFillRef(raw.styleRef.fillRef.idx, theme);
      if (fmtFill) {
        // B4: phClr 替换 (用 fillRef 内 color 作 override)
        effectiveFill = raw.styleRef.fillRef.color
          ? replacePhClrInFill(fmtFill, raw.styleRef.fillRef.color)
          : fmtFill;
      }
    }
    // C4: fill switch 4 分支 (solid / gradient / blip / pattern)
    if (effectiveFill?.type === 'solid' && effectiveFill.color) {
      fill = { css: `background-color: ${colorToCss(effectiveFill.color, theme, clrMap)};` };
    } else if (effectiveFill?.type === 'gradient' && effectiveFill.gradient?.stops) {
      const stops = effectiveFill.gradient.stops
        .map((s) => `${colorToCss(s.color, theme, clrMap)} ${s.pos / 1000}%`)
        .join(', ');
      const angleDeg = (effectiveFill.gradient.angle ?? 0) / 60000;
      fill = { css: `background: linear-gradient(${angleDeg}deg, ${stops});` };
    } else if (effectiveFill?.type === 'blip' && effectiveFill.blipRef?.embed) {
      // C4: blip 在 render-pipeline 输出 embed 占位, adapter 层会用 mediaUrlMap 替换实际 URL
      fill = { css: `background-image: url('blip://${effectiveFill.blipRef.embed}'); background-size: cover;` };
    } else if (effectiveFill?.type === 'pattern') {
      fill = { css: `background-color: #DDDDDD; /* pattFill ${effectiveFill.pattPrst} (Plan 2) */` };
    }
  }
  // outline: lineRef 优先 → 解 fmtScheme.lineStyleLst[idx-1]
  let effectiveOutline: RawOutline | undefined = raw.outline;
  if (raw.styleRef?.lineRef && !effectiveOutline?.color) {
    const fmtLine = resolveLineRef(raw.styleRef.lineRef.idx, theme);
    if (fmtLine) {
      // phClr 替换 outline color
      const overrideColor = raw.styleRef.lineRef.color;
      const resolvedColor = (fmtLine.color?.val === 'phClr' && overrideColor)
        ? overrideColor
        : fmtLine.color;
      effectiveOutline = { ...fmtLine, color: resolvedColor };
    }
  }
  const outline = effectiveOutline?.color
    ? { css: `border: ${(effectiveOutline.width ?? 12700) / 9525}px solid ${colorToCss(effectiveOutline.color, theme, clrMap)};` }
    : null;

  logger?.apply({
    ...META, context: { element: 'p:sp', ...shapeCtx },
    input: { hasGeom: !!raw.geom, hasFill: !!raw.fill, hasOutline: !!raw.outline, useBgFill: !!raw.useBgFill },
    output: { bbox: xfrm.bbox, geometryType: geometry.type },
  });

  return {
    kind: 'shape', id: raw.id, sourceLayer: 'slide',
    bbox: xfrm.bbox, transform: xfrm.transform,
    fill, outline, geometry,
    text: null,  // 文本解析交给 transform.ts 主入口编排
    phType: raw.ph?.type,
  };
}

function colorToCss(c: RawColor, theme: RawTheme, clrMap: RawClrMap): string {
  let baseHex: string;
  if (c.type === 'srgb') baseHex = `#${c.val}`;
  else if (c.type === 'scheme') baseHex = resolveSchemeColor(c.val, clrMap, theme.clrScheme);
  else if (c.type === 'preset') baseHex = resolvePresetColor(c.val);
  else if (c.type === 'sys') baseHex = '#000000';
  else baseHex = '#000000';
  if (c.modifiers && c.modifiers.length > 0) {
    return applyColorModifiers(baseHex, c.modifiers as ColorModifier[]);
  }
  return baseHex;
}
