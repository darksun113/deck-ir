import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseTheme } from './theme';

describe('parseTheme', () => {
  it('解析 12 色 clrScheme + fontScheme', () => {
    const xml = readFileSync(path.join(__dirname, '../../../../../../tests/integration/fixtures/phase-a/minimal-theme.xml'), 'utf8');
    const theme = parseTheme('theme1', '/ppt/theme/theme1.xml', xml);
    expect(theme.clrScheme.dk1).toBe('#000000');  // sysClr 取 lastClr
    expect(theme.clrScheme.lt1).toBe('#FFFFFF');
    expect(theme.clrScheme.accent1).toBe('#4F81BD');
    expect(theme.clrScheme.folHlink).toBe('#800080');
    expect(theme.fontScheme.majorLatin).toBe('Calibri Light');
    expect(theme.fontScheme.minorLatin).toBe('Calibri');
  });

  it('T5: fmtScheme 三个 styleLst 各 >= 3 项', () => {
    const xml = `<a:theme xmlns:a="x">
      <a:themeElements>
        <a:clrScheme>
          <a:dk1><a:srgbClr val="000000"/></a:dk1>
          <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
          <a:dk2><a:srgbClr val="222222"/></a:dk2>
          <a:lt2><a:srgbClr val="EEEEEE"/></a:lt2>
          <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
          <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
          <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
          <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
          <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
          <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
          <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
          <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
        </a:clrScheme>
        <a:fontScheme name="x"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
        <a:fmtScheme name="Office">
          <a:fillStyleLst>
            <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
            <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
            <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
          </a:fillStyleLst>
          <a:lnStyleLst>
            <a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
            <a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
            <a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
          </a:lnStyleLst>
          <a:bgFillStyleLst>
            <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
            <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
            <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
          </a:bgFillStyleLst>
        </a:fmtScheme>
      </a:themeElements>
    </a:theme>`;
    const result = parseTheme('t', '', xml);
    expect(result.fmtScheme.fillStyleLst.length).toBeGreaterThanOrEqual(3);
    expect(result.fmtScheme.lineStyleLst.length).toBeGreaterThanOrEqual(3);
    expect(result.fmtScheme.bgFillStyleLst.length).toBeGreaterThanOrEqual(3);
    expect(result.fmtScheme.fillStyleLst[0].type).toBe('solid');
  });
});
