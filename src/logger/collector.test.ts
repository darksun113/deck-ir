import { describe, it, expect } from 'vitest';
import { createCollectorLogger } from './collector';

describe('CollectorLogger', () => {
  it('收 warn/error 并兼容旧 warnings: string[] 接口', () => {
    const logger = createCollectorLogger();
    logger.warn({ message: 'graphicFrame chart skipped', context: { element: 'p:graphicFrame', slideRef: 'slide3' } });
    logger.error({ message: 'theme1.xml parse error', context: { element: 'a:theme' } });
    const strings = logger.toStrings();
    expect(strings).toHaveLength(2);
    expect(strings[0]).toContain('graphicFrame chart skipped');
    expect(strings[1]).toContain('theme1.xml parse error');
  });

  it('apply 不进 warnings', () => {
    const logger = createCollectorLogger();
    logger.apply({
      decisionId: '#1', ruleName: 'x', source: {
        mappingDoc: 'm', mappingDocLine: 1, decisionDoc: 'd', officialRef: 'o',
      }, context: { element: 'p:sp' },
    });
    expect(logger.toStrings()).toHaveLength(0);
  });
});
