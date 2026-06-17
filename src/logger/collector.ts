import type { RuleLogger, RuleApplyEvent, WarnEvent, ErrorEvent } from './types';

export interface CollectorLogger extends RuleLogger {
  toStrings(): string[];
  toEvents(): Array<{ level: 'warn' | 'error'; event: WarnEvent | ErrorEvent }>;
}

export function createCollectorLogger(): CollectorLogger {
  const events: Array<{ level: 'warn' | 'error'; event: WarnEvent | ErrorEvent }> = [];
  return {
    apply: (_event: RuleApplyEvent) => {},
    warn: (event: WarnEvent) => events.push({ level: 'warn', event }),
    error: (event: ErrorEvent) => events.push({ level: 'error', event }),
    toStrings: () => events.map(({ level, event }) => {
      const slide = event.context.slideRef ? ` [${event.context.slideRef}]` : '';
      const elem = event.context.element ? ` (${event.context.element})` : '';
      return `[${level}]${slide}${elem} ${event.message}`;
    }),
    toEvents: () => [...events],
  };
}
