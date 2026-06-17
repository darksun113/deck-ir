// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

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
