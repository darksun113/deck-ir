import type { RuleLogger, RuleApplyEvent, WarnEvent, ErrorEvent } from './types';

export function createConsoleLogger(opts: { level?: 'debug' | 'warn' | 'error' } = {}): RuleLogger {
  const level = opts.level ?? 'debug';
  return {
    apply: (event: RuleApplyEvent) => {
      if (level === 'debug') {
        console.debug(`[apply ${event.decisionId}] ${event.ruleName} (${event.source.mappingDoc})`, { context: event.context, input: event.input, output: event.output });
      }
    },
    warn: (event: WarnEvent) => {
      if (level === 'debug' || level === 'warn') {
        console.warn(`[warn ${event.decisionId ?? ''}] ${event.message}`, event.context);
      }
    },
    error: (event: ErrorEvent) => {
      console.error(`[error ${event.decisionId ?? ''}] ${event.message}`, event.context);
    },
  };
}
