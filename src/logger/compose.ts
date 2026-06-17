// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RuleLogger, RuleApplyEvent, WarnEvent, ErrorEvent } from './types';

export function composeLoggers(loggers: RuleLogger[]): RuleLogger {
  return {
    apply: (event: RuleApplyEvent) => loggers.forEach((l) => l.apply(event)),
    warn: (event: WarnEvent) => loggers.forEach((l) => l.warn(event)),
    error: (event: ErrorEvent) => loggers.forEach((l) => l.error(event)),
  };
}
