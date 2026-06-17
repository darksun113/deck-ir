// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

const _META = {
  decisionId: '#50',
  ruleName: 'bullet (buAutoNum 40 枚举 + buChar + buFont) → CSS',
  source: {
    mappingDoc: 'mapping.md 第 6 章 6.6',
    mappingDocLine: 0,
    decisionDoc: 'plan-2B-design § 1.2 A2.4',
    officialRef: 'ECMA-376 §21.1.10 buAutoNum/buChar/buFont',
  },
} as const;
void _META;

interface RawBullet {
  auto?: { type: string; startAt?: number };
  char?: string;
  none?: true;
  font?: string;
}

// OOXML buAutoNum 40 枚举 → CSS list-style-type 映射
// CSS 原生不支持的 CJK / 国际枚举退化 decimal
const BULLET_AUTO_MAP: Record<string, string> = {
  arabicPeriod: 'decimal',
  arabicParenR: 'decimal',
  arabicParenBoth: 'decimal',
  arabicPlain: 'decimal',
  arabicDbPeriod: 'decimal',
  arabicDbPlain: 'decimal',
  romanUcPeriod: 'upper-roman',
  romanLcPeriod: 'lower-roman',
  romanUcParenR: 'upper-roman',
  romanLcParenR: 'lower-roman',
  romanUcParenBoth: 'upper-roman',
  romanLcParenBoth: 'lower-roman',
  upperRoman: 'upper-roman',
  lowerRoman: 'lower-roman',
  alphaUcPeriod: 'upper-alpha',
  alphaLcPeriod: 'lower-alpha',
  alphaUcParenR: 'upper-alpha',
  alphaLcParenR: 'lower-alpha',
  alphaUcParenBoth: 'upper-alpha',
  alphaLcParenBoth: 'lower-alpha',
  upperAlpha: 'upper-alpha',
  lowerAlpha: 'lower-alpha',
};

/** RawBullet → CSS 内联字符串 */
export function bulletToCss(bullet: RawBullet | undefined): string {
  if (!bullet) return '';
  if (bullet.none) return 'list-style: none;';

  if (bullet.char !== undefined) {
    const parts = [`--bullet-char: '${bullet.char.replace(/'/g, "\\'")}';`];
    if (bullet.font) {
      parts.push(`--bullet-font: '${bullet.font}';`);
    }
    return parts.join(' ');
  }

  if (bullet.auto) {
    const cssType = BULLET_AUTO_MAP[bullet.auto.type] ?? 'decimal';
    const parts = [`list-style-type: ${cssType};`];
    if (!BULLET_AUTO_MAP[bullet.auto.type]) {
      parts.push(`/* buAutoNum: ${bullet.auto.type} (退化 decimal) */`);
    }
    if (bullet.auto.startAt !== undefined && bullet.auto.startAt !== 1) {
      parts.push(`counter-reset: list-counter ${bullet.auto.startAt - 1};`);
    }
    return parts.join(' ');
  }

  return '';
}
