import { describe, it, expect } from 'vitest';
import { resolveMcAlternateContent } from './mc-alternate';

describe('mc:AlternateContent (追踪 #18)', () => {
  it('Choice 全支持 → 选 Choice', () => {
    const node = {
      '@_': {},
      'mc:Choice': { '@_Requires': 'p14', children: [{ 'p:pic': {} }] } as any,
      'mc:Fallback': { children: [{ 'p:pic': { fallback: true } as any }] },
    };
    const r = resolveMcAlternateContent(node, () => true);
    expect((r as any[])[0]['p:pic']).toBeDefined();
    expect((r as any[])[0]['p:pic'].fallback).toBeUndefined();
  });
  it('Choice 含不支持元素 → fallback Fallback', () => {
    const node = {
      '@_': {},
      'mc:Choice': { '@_Requires': 'p14', children: [{ 'p14:media': {} }] } as any,
      'mc:Fallback': { children: [{ 'p:pic': { fallback: true } as any }] },
    };
    const r = resolveMcAlternateContent(node, (el) => !('p14:media' in (el as any)));
    expect((r as any[])[0]['p:pic'].fallback).toBe(true);
  });
  it('Choice + Fallback 都失败 → null', () => {
    const node = { '@_': {}, 'mc:Choice': { '@_Requires': 'p14', children: [{ 'p14:media': {} }] } as any };
    expect(resolveMcAlternateContent(node, (el) => !('p14:media' in (el as any)))).toBeNull();
  });
});
