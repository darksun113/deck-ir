// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

export type SemanticLayer = 'master' | 'layout' | 'slide';

export interface SemanticBBox {
  x: number;                                // px
  y: number;
  w: number;
  h: number;
}

export interface SemanticCss {
  css: string;                              // 已生成的 CSS 字符串
}

// ============ Element 基类 ============
export interface SemanticElementBase {
  id: string;
  sourceLayer: SemanticLayer;
  bbox: SemanticBBox;
  transform: string;                        // CSS transform 字符串
  phType?: string;                          // 占位符类型
  groupId?: string;                         // 若属于 grpSp(扁平化后保留 group meta)
}

// ============ 形状 ============
export interface SemanticShape extends SemanticElementBase {
  kind: 'shape';
  fill: SemanticCss | null;
  outline: SemanticCss | null;
  geometry: SemanticGeometry;
  text: SemanticTextBody | null;
}

export type SemanticGeometry =
  | { type: 'div'; cssRadius?: string }      // 用 div + CSS border-radius(ellipse→50% / roundRect→px)
  | { type: 'svg-line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'svg-path'; d: string; viewBox: string };

// ============ 图片 ============
export interface SemanticPicture extends SemanticElementBase {
  kind: 'image';
  src: string;                              // embedId (rId) — adapter 阶段经 mediaUrlMap 复合 key 转 OSS key
  ownerKind: 'slide' | 'layout' | 'master'; // D2: 复合 key 第 1 段
  ownerId: string;                          // D2: 复合 key 第 2 段
  alt: string;
  title?: string;
  cssExtra?: string;                        // filter / clip-path / opacity 等
  srcRect?: { l?: number; t?: number; r?: number; b?: number };  // C2: 边裁剪 (1/1000%)，渲染时转 object-position
}

// ============ 不支持元素降级占位 ============
export interface SemanticPlaceholder extends SemanticElementBase {
  kind: 'placeholder';
  reason: string;                           // 如 "graphicFrame chart - IMM PNG fallback"
}

export type SemanticElement = SemanticShape | SemanticPicture | SemanticPlaceholder;

// ============ 文本 ============
export interface SemanticTextBody {
  paragraphs: SemanticParagraph[];
  bodyStyle: string;                        // CSS for outer text container
}

export interface SemanticParagraph {
  runs: SemanticTextRun[];
  pStyle: string;                           // CSS for paragraph
}

export interface SemanticTextRun {
  text: string;
  rStyle: string;                           // CSS for run (font-size, color, font-weight 等)
}

// ============ Slide ============
export interface SemanticSlide {
  id: string;
  layoutId: string;
  masterId: string;
  themeId: string;
  background: SemanticCss;
  elements: SemanticElement[];              // 拍平 z-order(master → layout → slide)
  warnings: string[];
}

// ============ 顶层 IR ============
export interface SemanticIR {
  slideSize: { w: number; h: number };      // px
  slides: SemanticSlide[];
}
