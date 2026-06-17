// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RawIR, RawShape, RawPicture, RawGroupShape, RawGraphicFrame, RawTheme, RawClrMap, RawTextBody } from '../ir/raw';
import type { SemanticIR, SemanticSlide, SemanticElement, SemanticTextBody, SemanticParagraph, SemanticTextRun } from '../ir/semantic';
import type { RuleLogger } from '../logger/types';
import { buildLineages } from './lineage';
import { mergeLayerDecorations } from './layer-merge';
import { renderShape } from '../rules/shapes/render-pipeline';
import { shouldSkipSlide } from '../rules/pages/slide-show-false';
import { mergeSlideBackground } from '../rules/pages/background-merge';
import { emuToPx } from '../rules/units/emu';
import { projectChildInGroup } from '../rules/groups/child-projection';
import { bodyPrToCss } from '../rules/text/body-pr';
import { algnToCss, paragraphPropsToCss } from '../rules/text/paragraph';
import { runToCss } from '../rules/text/run';
import { bulletToCss } from '../rules/text/bullet';

export function transformToSemanticIR(raw: RawIR, logger: RuleLogger): SemanticIR {
  const lineages = buildLineages(raw);
  const slides: SemanticSlide[] = [];

  for (const lineage of lineages) {
    const rawSlide = raw.slides.find((s) => s.id === lineage.slideId)!;

    // 追踪 #21 跳过隐藏页
    if (shouldSkipSlide(rawSlide.show, rawSlide.id, logger)) continue;

    const master = raw.masters.find((m) => m.id === lineage.masterId)!;
    const layout = raw.layouts.find((l) => l.id === lineage.layoutId)!;
    const theme = raw.themes.find((t) => t.id === lineage.themeId)!;

    // Step 7: 三层装饰合并
    const merged = mergeLayerDecorations(
      master.cSld.spTree, layout.cSld.spTree, rawSlide.cSld.spTree,
      { showMaster: lineage.effectiveShowMasterSp, masterId: lineage.masterId, layoutId: lineage.layoutId, slideId: lineage.slideId }
    );

    // 三层背景合并 (Step 9 sort: 先算 slide 背景, 再给子元素用作 useBgFill 输入)
    const slideBgSemantic = mergeSlideBackground({
      master: master.cSld.bg,
      layout: layout.cSld.bg,
      slide: rawSlide.cSld.bg,
      theme,
      clrMap: lineage.effectiveClrMap,
    }, logger);

    // W1: 从 CSS 字符串抽 cssBackground 部分给 applyUseBgFill (追踪 #23)
    const cssBackground = slideBgSemantic.css.replace(/^background:\s*/, '').replace(/;\s*$/, '');
    const slideBackgroundInput = {
      cssBackground,
      w: emuToPx(raw.slideSize.cx_emu),
      h: emuToPx(raw.slideSize.cy_emu),
    };

    // Step 8: 提取每个元素 + 应用规则
    const elements: SemanticElement[] = [];
    for (const tagged of merged) {
      const result = transformElement(tagged.child, { slideRef: rawSlide.id, ownerKind: tagged.ownerKind, ownerId: tagged.ownerId }, theme, lineage.effectiveClrMap, slideBackgroundInput, logger);
      if (Array.isArray(result)) elements.push(...result);
      else if (result) elements.push(result);
    }

    slides.push({
      id: lineage.slideId, layoutId: lineage.layoutId, masterId: lineage.masterId, themeId: lineage.themeId,
      background: slideBgSemantic,
      elements,
      warnings: [],
    });
  }

  return {
    slideSize: {
      w: emuToPx(raw.slideSize.cx_emu),
      h: emuToPx(raw.slideSize.cy_emu),
    },
    slides,
  };
}

/** 占位符"提示文字"识别(PowerPoint/WPS 默认 prompt,只在编辑态显示,不该当内容)。
 *  仅对 placeholder(raw.ph)生效,避免误伤真实正文。 */
function isPlaceholderPrompt(text: string): boolean {
  if (!text) return false;
  return /^单击此处/.test(text)
    || /^单击添加/.test(text)
    || /^请单击/.test(text)
    || /编辑母版.{0,4}样式/.test(text)
    || /^点击(此处)?(添加|输入|编辑)/.test(text)
    || /^Click to (add|edit)/i.test(text)
    || /^Click icon to add/i.test(text);
}

function transformElement(
  raw: RawShape | RawPicture | RawGroupShape | RawGraphicFrame,
  ctx: { slideRef: string; ownerKind: 'master' | 'layout' | 'slide'; ownerId: string },
  theme: RawTheme,
  clrMap: RawClrMap,
  slideBackground: { cssBackground: string; w: number; h: number },
  logger: RuleLogger
): SemanticElement | SemanticElement[] | null {
  switch (raw.kind) {
    case 'sp': {
      const rendered = renderShape(raw, theme, clrMap, slideBackground, logger, ctx);
      // A3: txBody → SemanticShape.text 填充
      if (raw.txBody) {
        const text = applyTextRules(raw.txBody, theme, clrMap);
        // 修#3: 空占位符继承的"提示文字"(单击此处编辑母版标题样式…)只在编辑态显示,不该渲染成内容。
        const plain = text.paragraphs.flatMap((p) => p.runs.map((r) => r.text)).join('').trim();
        if (raw.ph && isPlaceholderPrompt(plain)) {
          // 提示文字 → 留空占位(不设 text)
        } else {
          rendered.text = text;
        }
      }
      return rendered;
    }
    case 'pic': {
      // C2: srcRect 边裁剪 → 渲染时转 object-position(见 element-html)。设计师常把 frame 配成裁剪区比例,
      // 故 object-fit:cover + object-position 等价于"显示裁剪区"。透传到 SemanticPicture。
      if (raw.xfrm?.rot) {
        logger.warn({ decisionId: 'P2-#9', message: `pic ${raw.id} 旋转 ${raw.xfrm.rot} 暂未应用 (Plan 2)`,
          context: { element: 'p:pic', slideRef: ctx.slideRef } });
      }
      if (raw.xfrm?.flipH || raw.xfrm?.flipV) {
        logger.warn({ decisionId: 'P2-#9', message: `pic ${raw.id} flip 暂未应用 (Plan 2)`,
          context: { element: 'p:pic', slideRef: ctx.slideRef } });
      }
      // bbox 用 xfrm 真实坐标 (T1 已读 xfrm)
      const bbox = raw.xfrm?.off && raw.xfrm?.ext
        ? { x: raw.xfrm.off.x / 9525, y: raw.xfrm.off.y / 9525, w: raw.xfrm.ext.cx / 9525, h: raw.xfrm.ext.cy / 9525 }
        : { x: 0, y: 0, w: 0, h: 0 };
      return {
        kind: 'image', id: raw.id, sourceLayer: ctx.ownerKind,
        bbox, transform: '',
        src: raw.blipRef.embed ?? '',
        ownerKind: ctx.ownerKind,     // D: pic 来源层 (master/layout/slide) 按标签归属
        ownerId: ctx.ownerId,
        alt: raw.cNvPr?.descr ?? '',
        srcRect: raw.srcRect,
      };
    }
    case 'grpSp': {
      // T7: grpSp 递归 + chOff/chExt 投影 (追踪 P1 #7 + #9 + #10)
      if (!raw.xfrm) {
        logger.warn({ decisionId: 'P1-#7', message: 'grpSp 无 xfrm 跳过',
          context: { element: 'p:grpSp', slideRef: ctx.slideRef } });
        return null;
      }
      const groupGeom = {
        off: raw.xfrm.off ?? { x: 0, y: 0 },
        ext: raw.xfrm.ext ?? { cx: 1, cy: 1 },
        chOff: raw.xfrm.chOff ?? { x: 0, y: 0 },   // B5: 默认 (0,0), 不再 fallback group.off
        chExt: raw.xfrm.chExt ?? raw.xfrm.ext ?? { cx: 1, cy: 1 },  // chExt 默认 ext (OOXML 合理)
      };
      const flattened: SemanticElement[] = [];
      for (const child of raw.children) {
        if (!('xfrm' in child) || !child.xfrm?.off || !child.xfrm?.ext) {
          // 子元素无 xfrm,直接递归(不投影)
          const sub = transformElement(child, ctx, theme, clrMap, slideBackground, logger);
          if (Array.isArray(sub)) flattened.push(...sub);
          else if (sub) flattened.push(sub);
          continue;
        }
        // 投影 child 几何到外层坐标系
        const projected = projectChildInGroup(groupGeom, {
          off: child.xfrm.off,
          ext: child.xfrm.ext,
        }, logger, { slideRef: ctx.slideRef, shapeId: child.id });
        const projectedChild = {
          ...child,
          xfrm: {
            ...child.xfrm,
            off: { x: projected.x, y: projected.y },
            ext: { cx: projected.w, cy: projected.h },
          },
        };
        const sub = transformElement(projectedChild as typeof child, ctx, theme, clrMap, slideBackground, logger);
        if (Array.isArray(sub)) flattened.push(...sub);
        else if (sub) flattened.push(sub);
      }
      // 加 groupId 元信息,扁平化后保留 group meta
      for (const el of flattened) (el as { groupId?: string }).groupId = raw.id;
      return flattened;
    }
    case 'graphicFrame': {
      // 修2: SmartArt 缓存绘图已解析出形状 → 当普通形状渲染(roundRect 红/灰导航块 + 文字)。
      if (raw.diagramShapes && raw.diagramShapes.length > 0) {
        return raw.diagramShapes.map((sp): SemanticElement => {
          const rendered = renderShape(sp, theme, clrMap, slideBackground, logger, ctx);
          if (sp.txBody) rendered.text = applyTextRules(sp.txBody, theme, clrMap);
          return rendered;
        });
      }
      // chart / table / 无缓存绘图 → 仍占位(documented MVP 限制)
      logger.warn({ decisionId: '#56', message: `graphicFrame ${raw.uri} → IMM PNG fallback`,
        context: { element: 'p:graphicFrame', slideRef: ctx.slideRef } });
      return {
        kind: 'placeholder', id: raw.id, sourceLayer: 'slide',
        bbox: { x: 0, y: 0, w: 0, h: 0 }, transform: '',
        reason: `graphicFrame ${raw.uri} (IMM PNG fallback)`,
      };
    }
    default:
      return null;
  }
}

/**
 * A3.1: RawTextBody → SemanticTextBody (5 rule 编排)
 * bodyPrToCss + algnToCss + paragraphPropsToCss + bulletToCss + runToCss
 */
function applyTextRules(rawTxBody: RawTextBody, theme: RawTheme, clrMap: RawClrMap): SemanticTextBody {
  return {
    bodyStyle: bodyPrToCss(rawTxBody.bodyPr),
    paragraphs: rawTxBody.paragraphs.map((p): SemanticParagraph => {
      const pStyle = [
        algnToCss(p.pPr?.algn),
        paragraphPropsToCss(p.pPr),
        bulletToCss(p.pPr?.bullet),
      ].filter(Boolean).join(' ');
      const runs: SemanticTextRun[] = p.runs.map((r) => ({
        text: r.text,
        rStyle: r.rPr ? runToCss(r.rPr, theme, clrMap) : '',
      }));
      return { runs, pStyle };
    }),
  };
}
