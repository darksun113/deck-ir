import type { RuleLogger } from '../../logger/types';

const META_INK = {
  decisionId: '#59',
  ruleName: 'Ink reuse custGeom path (Gemini key revision)',
  source: {
    mappingDoc: 'mapping.md 第 10 章 10.10',
    mappingDocLine: 7194,
    decisionDoc: 'undecided-resolved.md #59',
    officialRef: 'p:ink fallback custGeom shape (PowerPoint always generates)',
  },
} as const;

/**
 * Ink 元素策略: 复用 custGeom 解析路径 (追踪 #59 Gemini 关键修正)
 * PowerPoint 永远生成 fallback custGeom shape;parser 把 <p:ink> 当 <p:sp> 处理
 */
export function reuseInkAsShape(logger?: RuleLogger, ctx?: { slideRef?: string }): void {
  logger?.apply({
    ...META_INK, context: { element: 'p:ink', ...ctx },
    input: {}, output: { strategy: 'reuse custGeom from p:spPr' },
  });
  // 实际处理:transform.ts 主入口检测到 p:ink 时调 renderShape (复用 sp 路径)
}
