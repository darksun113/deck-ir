import { describe, it, expect } from 'vitest';
import { composeLoggers } from './compose';
import { createCollectorLogger } from './collector';
import { createNoopLogger } from './noop';

describe('composeLoggers', () => {
  it('一次 warn 触发所有 sink', () => {
    const collector1 = createCollectorLogger();
    const collector2 = createCollectorLogger();
    const noop = createNoopLogger();
    const composed = composeLoggers([collector1, collector2, noop]);
    composed.warn({ message: 'test', context: {} });
    expect(collector1.toStrings()).toHaveLength(1);
    expect(collector2.toStrings()).toHaveLength(1);
  });
});
