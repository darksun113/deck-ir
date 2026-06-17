import { describe, it, expect } from 'vitest';
import { applyColorModifiers } from './modifiers';

describe('applyColorModifiers (追踪 #7 XML 顺序)', () => {
  it('lumMod 60% + lumOff 40% (中文淡化 40%) → 灰色变浅', () => {
    // accent1 #4F81BD (HSL: 210, 41%, 53%)
    // lumMod×0.6 → l=0.32, lumOff+0.4 → l=0.72 (变浅)
    const result = applyColorModifiers('#4F81BD', [
      { name: 'lumMod', val: 60000 },
      { name: 'lumOff', val: 40000 },
    ]);
    // 比原色更亮 (l 增加)
    expect(result).not.toBe('#4F81BD');
    // 视觉上更接近白色
    const r = parseInt(result.slice(1, 3), 16);
    expect(r).toBeGreaterThan(0x4F);
  });

  it('XML 顺序敏感: 交换 lumOff/lumMod 顺序结果不同', () => {
    const a = applyColorModifiers('#4F81BD', [
      { name: 'lumMod', val: 60000 },
      { name: 'lumOff', val: 40000 },
    ]);
    const b = applyColorModifiers('#4F81BD', [
      { name: 'lumOff', val: 40000 },
      { name: 'lumMod', val: 60000 },
    ]);
    expect(a).not.toBe(b);
  });
});
