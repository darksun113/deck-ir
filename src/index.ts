import type { RuleLogger } from './logger/types';

export const DECK_IR_VERSION = "0.1.0";

export interface ParserContext {
  logger: RuleLogger;
  readZipEntry: (name: string) => Promise<Buffer | string>;
}

export type { RuleLogger, RuleApplyEvent, WarnEvent, ErrorEvent, RuleSource } from './logger/types';
export * from './ir';
// createNoopLogger / createConsoleLogger 不从顶层 barrel 暴露:需要时直接 import from './logger/...'
export {
  createCollectorLogger,
  composeLoggers, type CollectorLogger,
} from './logger';
export { parsePptxToRawIR } from './raw/parse-pptx';
export { transformToSemanticIR } from './semantic/transform';
export { buildLineages, type SlideLineage } from './semantic/lineage';
export { parsePptx } from './parse-pptx-api';
export type { ParseOptions, ParsedDeck } from './api-types';
export { emitSlideHtml } from './emit/slide-html';
