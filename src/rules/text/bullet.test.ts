import { describe, it, expect } from 'vitest';
import { bulletToCss } from './bullet';

describe('bulletToCss (A2.4)', () => {
  it('buNone → list-style: none', () => {
    expect(bulletToCss({ none: true })).toContain('list-style: none');
  });

  it('buChar="•" → ::before content (无 list-style)', () => {
    const css = bulletToCss({ char: '•' });
    expect(css).toContain('--bullet-char:');
    expect(css).toContain('•');
  });

  it('buChar + buFont Wingdings → 加 font-family', () => {
    const css = bulletToCss({ char: 'l', font: 'Wingdings' });
    expect(css).toContain('--bullet-font:');
    expect(css).toContain('Wingdings');
  });

  it('buAutoNum arabicPeriod → list-style-type: decimal', () => {
    const css = bulletToCss({ auto: { type: 'arabicPeriod' } });
    expect(css).toContain('list-style-type: decimal');
  });

  it('buAutoNum upperRoman → list-style-type: upper-roman', () => {
    const css = bulletToCss({ auto: { type: 'upperRoman' } });
    expect(css).toContain('list-style-type: upper-roman');
  });

  it('buAutoNum 未知 type → 退化 decimal + warn 注释', () => {
    const css = bulletToCss({ auto: { type: 'koreanCounter' } });
    expect(css).toContain('list-style-type: decimal');
    expect(css).toContain('koreanCounter');
  });

  it('空 bullet (undefined) → 空字符串', () => {
    expect(bulletToCss(undefined)).toBe('');
  });
});
