import type { RuleLogger } from '../../logger/types';

const _META = {
  decisionId: '#21',
  ruleName: 'slide show=false skip',
  source: {
    mappingDoc: 'mapping.md 第 1 章 1.4',
    mappingDocLine: 1746,
    decisionDoc: 'undecided-resolved.md #21',
    officialRef: 'documentformat.openxml.presentation.slide - show attr',
  },
} as const;

export function shouldSkipSlide(show: boolean, slideRef: string, logger?: RuleLogger): boolean {
  if (!show) {
    logger?.warn({
      decisionId: '#21',
      message: `slide ${slideRef} 隐藏 (show="false"),跳过`,
      context: { slideRef, element: 'p:sld' },
      reason: '与 PPT 放映视图一致',
    });
    return true;
  }
  return false;
}
