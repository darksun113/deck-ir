import { describe, it, expect } from 'vitest';
import { resolveFontSchemeMacro } from './font-scheme';
import type { RawTheme } from '../../ir/raw';

const fontScheme: RawTheme['fontScheme'] = {
  majorLatin: 'Calibri Light',
  minorLatin: 'Calibri',
  majorEa: '微软雅黑',
  minorEa: '宋体',
};

describe('resolveFontSchemeMacro (A2.5)', () => {
  it('+mn-lt → minorLatin (Calibri)', () => {
    expect(resolveFontSchemeMacro('+mn-lt', fontScheme)).toBe('Calibri');
  });

  it('+mj-lt → majorLatin (Calibri Light)', () => {
    expect(resolveFontSchemeMacro('+mj-lt', fontScheme)).toBe('Calibri Light');
  });

  it('+mn-ea → minorEa (宋体)', () => {
    expect(resolveFontSchemeMacro('+mn-ea', fontScheme)).toBe('宋体');
  });

  it('+mj-ea → majorEa (微软雅黑)', () => {
    expect(resolveFontSchemeMacro('+mj-ea', fontScheme)).toBe('微软雅黑');
  });

  it('普通字体名 (Arial) → 原样返回', () => {
    expect(resolveFontSchemeMacro('Arial', fontScheme)).toBe('Arial');
  });

  it('未知宏 +xy-zz → 原样返回', () => {
    expect(resolveFontSchemeMacro('+xy-zz', fontScheme)).toBe('+xy-zz');
  });
});
