import { describe, it, expect } from 'vitest';
import { applyUseBgFill } from './use-bg-fill';

describe('applyUseBgFill (追踪 #23 背景同步偏移)', () => {
  it('生成 background + size + position(反向偏移)', () => {
    const { css } = applyUseBgFill({
      shape: { x: 100, y: 200, w: 300, h: 150 },
      slideBackground: { cssBackground: 'linear-gradient(45deg, #ff0, #f00)', w: 960, h: 540 },
    });
    expect(css).toContain('background: linear-gradient(45deg, #ff0, #f00);');
    expect(css).toContain('background-size: 960px 540px;');
    expect(css).toContain('background-position: -100px -200px;');
  });
});
