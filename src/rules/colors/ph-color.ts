import type { RawColor, RawFill } from '../../ir/raw';

const _META = {
  decisionId: '#16',
  ruleName: 'phClr placeholder replacement',
  source: {
    mappingDoc: 'mapping.md 第 0 章 0.5.4.e + 第 8 章 8.5',
    mappingDocLine: 1273,
    decisionDoc: 'undecided-resolved.md #16 (语义起点) + #55 (边界)',
    officialRef: 'ECMA-376 §20.1.4.1.20 fmtScheme',
  },
} as const;

/**
 * 替换 fill 内的 phClr 占位符 token (追踪 #16/#55)
 * - 如果 fill 内含 phClr，用 overrideColor 替换
 * - 如果 fill 不含 phClr (直接写死 srgbClr)，忽略 overrideColor (追踪 #55 候选 A)
 *
 * 双向同步约束 1: 修改本算法时需同步映射手册第 0 章 0.5.4.e 节
 */
export function replacePhClrInFill(fill: RawFill, overrideColor: RawColor): RawFill {
  // solid: 直接看 fill.color
  if (fill.type === 'solid' && fill.color?.type === 'scheme' && fill.color.val === 'phClr') {
    return {
      ...fill,
      color: {
        type: overrideColor.type,
        val: overrideColor.val,
        // 保留 phClr 原 modifiers (例如 fmtScheme lumMod 50%)
        modifiers: fill.color.modifiers ?? overrideColor.modifiers,
      },
    };
  }
  // gradient: 递归替换每个 stop
  if (fill.type === 'gradient' && fill.gradient?.stops) {
    return {
      ...fill,
      gradient: {
        ...fill.gradient,
        stops: fill.gradient.stops.map((stop) => {
          if (stop.color.type === 'scheme' && stop.color.val === 'phClr') {
            return {
              ...stop,
              color: {
                type: overrideColor.type,
                val: overrideColor.val,
                modifiers: stop.color.modifiers ?? overrideColor.modifiers,
              },
            };
          }
          return stop;
        }),
      },
    };
  }
  // blip / pattern / none / 直接 srgb fill: 不动 (#55 边界)
  return fill;
}
