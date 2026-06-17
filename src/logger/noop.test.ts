// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { createNoopLogger } from './noop';

describe('NoopLogger', () => {
  it('apply/warn/error 都不抛错,返回 undefined', () => {
    const logger = createNoopLogger();
    expect(logger.apply({
      decisionId: '#1', ruleName: 'test', source: {
        mappingDoc: 'mapping.md', mappingDocLine: 1,
        decisionDoc: 'undecided.md #1', officialRef: 'test',
      },
      context: { element: 'p:sp' },
    })).toBeUndefined();
    expect(logger.warn({ message: 'w', context: {} })).toBeUndefined();
    expect(logger.error({ message: 'e', context: {} })).toBeUndefined();
  });
});
