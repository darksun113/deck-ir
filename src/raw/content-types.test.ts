import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseContentTypes } from './content-types';

describe('parseContentTypes', () => {
  it('提取 master/layout/slide/theme 文件路径', () => {
    const xml = readFileSync(path.join(__dirname, '../../tests/integration/fixtures/phase-a/minimal-content-types.xml'), 'utf8');
    const result = parseContentTypes(xml);
    expect(result.masterParts).toContain('/ppt/slideMasters/slideMaster1.xml');
    expect(result.layoutParts).toContain('/ppt/slideLayouts/slideLayout1.xml');
    expect(result.slideParts).toContain('/ppt/slides/slide1.xml');
    expect(result.themeParts).toContain('/ppt/theme/theme1.xml');
  });
});
