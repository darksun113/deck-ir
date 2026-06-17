import type { RuleLogger, RuleApplyEvent, WarnEvent, ErrorEvent } from './types';

export function composeLoggers(loggers: RuleLogger[]): RuleLogger {
  return {
    apply: (event: RuleApplyEvent) => loggers.forEach((l) => l.apply(event)),
    warn: (event: WarnEvent) => loggers.forEach((l) => l.warn(event)),
    error: (event: ErrorEvent) => loggers.forEach((l) => l.error(event)),
  };
}
