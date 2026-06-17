import type { RuleLogger } from '../../logger/types';

const _META_TRANS = {
  decisionId: '#57',
  ruleName: 'transition permanent skip (HTML static)',
  source: {
    mappingDoc: 'mapping.md 第 10 章 10.3',
    mappingDocLine: 6919,
    decisionDoc: 'undecided-resolved.md #57',
    officialRef: 'documentformat.openxml.presentation.transition',
  },
} as const;

export function skipTransition(logger?: RuleLogger, ctx?: { slideRef?: string }): void {
  logger?.warn({ decisionId: '#57',
    message: 'p:transition 永久不支持 (HTML 静态页面)',
    context: { element: 'p:transition', ...ctx } });
}
