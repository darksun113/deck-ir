import { describe, it, expect } from 'vitest';
import { shouldSkipSlide } from './slide-show-false';

describe('shouldSkipSlide (追踪 #21)', () => {
  it('show=false → 跳过 + warn', () => {
    let warned = false;
    const logger = { apply: () => {}, warn: () => { warned = true; }, error: () => {} };
    expect(shouldSkipSlide(false, 'slide5', logger)).toBe(true);
    expect(warned).toBe(true);
  });
  it('show=true → 不跳过', () => {
    expect(shouldSkipSlide(true, 'slide1')).toBe(false);
  });
});
