// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import type { RuleLogger } from './types';

export function createNoopLogger(): RuleLogger {
  return {
    apply: () => {},
    warn: () => {},
    error: () => {},
  };
}
