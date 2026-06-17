import type { RuleLogger } from '../../logger/types';

const META = {
  decisionId: '#23',
  ruleName: 'useBgFill background sync offset',
  source: {
    mappingDoc: 'mapping.md 第 2 章 2.1',
    mappingDocLine: 2063,
    decisionDoc: 'undecided-resolved.md #23',
    officialRef: 'documentformat.openxml.presentation.shape - useBgFill',
  },
} as const;

export interface UseBgFillInput {
  shape: { x: number; y: number; w: number; h: number };
  slideBackground: { cssBackground: string; w: number; h: number };
}

export interface UseBgFillOutput {
  css: string;
}

export function applyUseBgFill(
  input: UseBgFillInput,
  logger?: RuleLogger,
  ctx?: { slideRef?: string; shapeId?: string }
): UseBgFillOutput {
  const { shape, slideBackground } = input;
  const css = [
    `background: ${slideBackground.cssBackground};`,
    `background-size: ${slideBackground.w}px ${slideBackground.h}px;`,
    `background-position: -${shape.x}px -${shape.y}px;`,
  ].join(' ');
  logger?.apply({
    ...META, context: { element: 'p:sp', ...ctx },
    input: { shape: { x: shape.x, y: shape.y } }, output: { css },
  });
  return { css };
}
