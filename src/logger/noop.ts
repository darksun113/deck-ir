import type { RuleLogger } from './types';

export function createNoopLogger(): RuleLogger {
  return {
    apply: () => {},
    warn: () => {},
    error: () => {},
  };
}
