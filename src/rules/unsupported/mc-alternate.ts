import type { RuleLogger } from '../../logger/types';

const META = {
  decisionId: '#18',
  ruleName: 'mc:AlternateContent smart choice + fallback',
  source: {
    mappingDoc: 'mapping.md 第 0 章 0.6.3 + 第 10 章 10.11.3',
    mappingDocLine: 1344,
    decisionDoc: 'undecided-resolved.md #18',
    officialRef: 'OOXML Markup Compatibility namespace',
  },
} as const;

const SUPPORTED_NAMESPACES = ['p:', 'a:', 'r:', 'mc:'];

interface McNode {
  '@_': Record<string, string>;
  'mc:Choice'?: McChoice | McChoice[];
  'mc:Fallback'?: { children?: unknown[] };
}

interface McChoice {
  '@_Requires': string;
  children?: unknown[];
}

/**
 * 智能选 mc:Choice (追踪 #18)
 * 1. 优先尝试 Choice (按 Requires 顺序)
 * 2. 若 Choice 内含不支持的扩展命名空间 → fallback Fallback
 * 3. Fallback 也读不出 → skip + warning
 */
export function resolveMcAlternateContent(
  node: McNode,
  isElementSupported: (el: unknown) => boolean,
  logger?: RuleLogger,
  ctx?: { slideRef?: string }
): unknown[] | null {
  const choices = Array.isArray(node['mc:Choice']) ? node['mc:Choice'] : node['mc:Choice'] ? [node['mc:Choice']] : [];

  for (const choice of choices) {
    const children = choice.children ?? [];
    const allSupported = children.every(isElementSupported);
    if (allSupported) {
      logger?.apply({ ...META, context: { element: 'mc:AlternateContent', ...ctx },
        input: { Requires: choice['@_Requires'] }, output: { selected: 'Choice', childCount: children.length } });
      return children;
    }
  }

  const fallback = node['mc:Fallback'];
  if (fallback?.children) {
    logger?.warn({ decisionId: '#18',
      message: 'mc:* fallback to Fallback (Choice 含不支持扩展命名空间元素)',
      context: { element: 'mc:AlternateContent', ...ctx } });
    return fallback.children;
  }

  logger?.warn({ decisionId: '#18',
    message: 'mc:AlternateContent skipped (无可读 Choice 或 Fallback)',
    context: { element: 'mc:AlternateContent', ...ctx } });
  return null;
}

export function isElementSupportedNamespace(el: unknown): boolean {
  if (typeof el !== 'object' || el === null) return true;
  const keys = Object.keys(el as Record<string, unknown>);
  return keys.every((k) => k.startsWith('@_') || SUPPORTED_NAMESPACES.some((ns) => k.startsWith(ns)));
}
