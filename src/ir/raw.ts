// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

// ============ 基础类型 ============
export type RawXmlAttrs = Record<string, string | number>;

export interface RawElementBase {
  id: string;
  name?: string;
  attrs?: RawXmlAttrs;
}

// ============ 几何 / 变换 ============
export interface RawXfrm {
  off?: { x: number; y: number };          // EMU
  ext?: { cx: number; cy: number };        // EMU
  chOff?: { x: number; y: number };        // EMU (仅 grpSp)
  chExt?: { cx: number; cy: number };      // EMU (仅 grpSp)
  rot?: number;                             // 1/60000 度 (追踪 #2)
  flipH?: boolean;
  flipV?: boolean;
}

export interface RawColor {
  type: 'srgb' | 'scheme' | 'preset' | 'hsl' | 'sys' | 'scrgb';
  val: string;                              // 如 "FF0000" / "accent1" / "red"
  modifiers?: Array<{ name: string; val: number }>;  // lumMod/lumOff/tint/shade 等
}

export interface RawFill {
  type: 'solid' | 'gradient' | 'blip' | 'pattern' | 'none' | 'group';
  color?: RawColor;
  gradient?: { stops: Array<{ pos: number; color: RawColor }>; angle?: number; scaled?: boolean };
  blipRef?: {
    embed?: string;
    link?: string;
    srcRect?: { l?: number; t?: number; r?: number; b?: number };  // C2: 裁剪 1/1000%
    tile?: { sx?: number; sy?: number; tx?: number; ty?: number; algn?: string };  // C2
    stretch?: boolean;  // C2: 默认 stretch 整张图
    alphaModFix?: number;  // C2: 透明度 1/1000%
  };
  pattPrst?: string;
}

export interface RawOutline {
  width?: number;                           // EMU
  color?: RawColor;
  prstDash?: string;
  cap?: string;
  cmpd?: string;
}

// ============ 形状 / 图片 / 组 ============
export interface RawStyleRef {
  fillRef?: { idx: number; color?: RawColor };
  lineRef?: { idx: number; color?: RawColor };
  effectRef?: { idx: number; color?: RawColor };
  fontRef?: { idx: string; color?: RawColor };
}

export interface RawShape extends RawElementBase {
  kind: 'sp';
  xfrm?: RawXfrm;
  geom?: { prst?: string; custPath?: RawCustPath; avLst?: Array<{ name: string; val: number }> };
  fill?: RawFill;
  outline?: RawOutline;
  useBgFill?: boolean;                      // 追踪 #23
  txBody?: RawTextBody;
  ph?: { type?: string; idx?: string; sz?: string; orient?: string };
  styleRef?: RawStyleRef;                   // B2/B3: <p:style>
}

export interface RawPicture extends RawElementBase {
  kind: 'pic';
  xfrm?: RawXfrm;
  blipRef: { embed?: string; link?: string };
  srcRect?: { l?: number; t?: number; r?: number; b?: number };  // 1/1000% (追踪 #3)
  cNvPr?: { descr?: string; title?: string; name?: string };     // 追踪 #41
  alphaModFix?: number;                     // amt 1/1000% (追踪 #3)
}

export interface RawGroupShape extends RawElementBase {
  kind: 'grpSp';
  xfrm?: RawXfrm;                           // 含 chOff/chExt
  fill?: RawFill;
  children: Array<RawShape | RawPicture | RawGroupShape | RawGraphicFrame>;
}

export interface RawGraphicFrame extends RawElementBase {
  kind: 'graphicFrame';
  xfrm?: RawXfrm;
  uri: string;                              // chart / table / diagram / chartEx (追踪 #56)
  diagramRelId?: string;                    // 修2: SmartArt 的 dgm:relIds r:dm(data 关系 id)，用于解析缓存绘图
  diagramShapes?: RawShape[];               // 修2: SmartArt 缓存绘图(drawingN.xml)解析出的形状(已套 graphicFrame 偏移)
}

// ============ 文本 ============
export interface RawTextBody {
  bodyPr?: { lIns?: number; rIns?: number; tIns?: number; bIns?: number; vert?: string; anchor?: string };
  paragraphs: RawParagraph[];
}

export interface RawParagraph {
  pPr?: {
    algn?: string;
    marL?: number;
    indent?: number;
    lnSpc?: { pct?: number; pts?: number };
    // A1.2: bullet 三种形态 (互斥)
    bullet?: {
      // buAutoNum: 自动编号 (40 枚举如 arabicPeriod / upperRoman / koreanCounter)
      auto?: { type: string; startAt?: number };
      // buChar: 字符项目符号 (如 • ○ ▪)
      char?: string;
      // buNone: 显式无项目符号
      none?: true;
      // buFont: 项目符号字体 (如 Wingdings)
      font?: string;
    };
  };
  runs: RawTextRun[];
}

export interface RawTextRun {
  rPr?: {
    sz?: number;
    b?: boolean;
    i?: boolean;
    u?: string;
    color?: RawColor;
    latin?: string;
    ea?: string;
    cs?: string;        // A1.3: 复杂脚本字体 (阿拉伯/希伯来)
    sym?: string;       // A1.3: 符号专用字体
    strike?: string;    // A1.3: 'sngStrike' | 'dblStrike' | 'noStrike'
    baseline?: number;  // A1.3: 上下标偏移 (千分比)
  };
  text: string;
}

// ============ custGeom 路径 ============
export interface RawCustPath {
  w: number;                                // 抽象坐标系
  h: number;
  commands: Array<
    | { type: 'moveTo'; x: number; y: number }
    | { type: 'lnTo'; x: number; y: number }
    | { type: 'cubicBezTo'; pts: Array<{ x: number; y: number }> }
    | { type: 'quadBezTo'; pts: Array<{ x: number; y: number }> }
    | { type: 'arcTo'; wR: number; hR: number; stAng: number; swAng: number }
    | { type: 'close' }
  >;
}

// ============ Slide 容器 ============
export interface RawCSld {
  bg: RawBackground | null;
  spTree: { children: Array<RawShape | RawPicture | RawGroupShape | RawGraphicFrame> };
}

export interface RawBackground {
  bgPr?: { fill: RawFill };
  bgRef?: { idx: number; color?: RawColor };
}

export interface RawSlide extends RawElementBase {
  filePath: string;
  cSld: RawCSld;
  layoutRef: string;                        // layout id
  show: boolean;                            // 追踪 #21
  showMasterSp: boolean | null;             // null = 未指定 (追踪 #22)
  mediaRefs: Record<string, string>;        // rId → media 路径
}

export interface RawLayout extends RawElementBase {
  filePath: string;
  cSld: RawCSld;
  masterRef: string;                        // master id
  clrMapOvr: RawClrMap | null;
  showMasterSp: boolean | null;             // 追踪 #22
  type?: string;                            // ST_SlideLayoutType
  mediaRefs: Record<string, string>;        // D1: rId → media 路径 (Plan 2A)
}

export interface RawMaster extends RawElementBase {
  filePath: string;
  cSld: RawCSld;
  clrMap: RawClrMap;
  themeRef: string;                         // theme id
  showMasterSp: boolean;                    // 默认 true
  mediaRefs: Record<string, string>;        // D1: rId → media 路径 (Plan 2A)
}

export interface RawClrMap {
  bg1: string; tx1: string; bg2: string; tx2: string;
  accent1: string; accent2: string; accent3: string;
  accent4: string; accent5: string; accent6: string;
  hlink: string; folHlink: string;
}

export interface RawTheme extends RawElementBase {
  filePath: string;
  clrScheme: Record<'dk1' | 'lt1' | 'dk2' | 'lt2' | 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6' | 'hlink' | 'folHlink', string>;
  fontScheme: { majorLatin: string; minorLatin: string; majorEa: string; minorEa: string };
  fmtScheme: { fillStyleLst: RawFill[]; lineStyleLst: RawOutline[]; bgFillStyleLst: RawFill[] };
}

// ============ Media Asset (T4) ============
export interface RawMediaAsset {
  embedId: string;                              // rId 如 "rId3"
  internalPath: string;                         // "/ppt/media/image1.png"
  ext: string;                                  // "png" / "jpg" / "jpeg" / "gif"
  mimeType: string;                             // "image/png" 等
  buffer: Buffer;                               // 文件二进制
  ownerKind: 'slide' | 'layout' | 'master';
  ownerId: string;
}

// ============ 顶层 IR ============
export interface RawIR {
  slideSize: { cx_emu: number; cy_emu: number };   // T2: 从 presentation.xml 读
  masters: RawMaster[];
  themes: RawTheme[];
  layouts: RawLayout[];
  slides: RawSlide[];
  relsGraph: Record<string, { layout?: string; media: Record<string, string> }>;
  mediaAssets: RawMediaAsset[];                    // T4: 所有 slide 层 media 二进制 (layout/master 留 Plan 2)
}
