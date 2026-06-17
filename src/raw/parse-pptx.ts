import JSZip from 'jszip';
import type { RawIR, RawMediaAsset } from '../ir/raw';
import type { ParserContext } from '../index';
import { parseContentTypes } from './content-types';
import { parsePresentation } from './presentation';
import { parseSlideMaster } from './slide-master';
import { parseSlideLayout } from './slide-layout';
import { parseSlide } from './slide';
import { parseTheme } from './theme';
import { resolveDiagramShapes } from './diagram-drawing';

function partDigit(part: string, kind: string): string {
  const re = new RegExp(`${kind}(\\d+)\\.xml$`);
  return part.match(re)?.[1] ?? '1';
}

export async function parsePptxToRawIR(
  pptxBuffer: Buffer,
  ctx: ParserContext
): Promise<RawIR> {
  // Step 1: 解压
  const zip = await JSZip.loadAsync(pptxBuffer);
  const ct = parseContentTypes(await zip.file('[Content_Types].xml')!.async('string'));

  // T2: 读 presentation.xml 取 slideSize
  const presFile = zip.file('ppt/presentation.xml');
  const slideSize = presFile
    ? parsePresentation(await presFile.async('string')).slideSize
    : { cx_emu: 12192000, cy_emu: 6858000 };

  const readZipText = async (partPath: string): Promise<string> => {
    const p = partPath.replace(/^\//, '');
    const f = zip.file(p);
    if (!f) throw new Error(`zip entry not found: ${partPath}`);
    return f.async('string');
  };
  const readZipRels = async (partPath: string): Promise<string> => {
    const dir = partPath.replace(/^\//, '').replace(/\/[^/]+$/, '');
    const fname = partPath.split('/').pop();
    const relsPath = `${dir}/_rels/${fname}.rels`;
    const f = zip.file(relsPath);
    return f ? f.async('string') : '';
  };
  // 修2: 按绝对路径读 part(不存在返回 null)，给 SmartArt 缓存绘图解析用
  const readPartOrNull = async (absPath: string): Promise<string | null> => {
    const f = zip.file(absPath.replace(/^\//, ''));
    return f ? f.async('string') : null;
  };

  // Step 2-3: masters + themes
  const masters = await Promise.all(ct.masterParts.map(async (part) => {
    const xml = await readZipText(part);
    const rels = await readZipRels(part);
    return parseSlideMaster(`master${partDigit(part, 'slideMaster')}`, part, xml, rels, ctx.logger);
  }));
  const themes = await Promise.all(ct.themeParts.map(async (part) => {
    const xml = await readZipText(part);
    return parseTheme(`theme${partDigit(part, 'theme')}`, part, xml);
  }));

  // Step 4: layouts
  const layouts = await Promise.all(ct.layoutParts.map(async (part) => {
    const xml = await readZipText(part);
    const rels = await readZipRels(part);
    return parseSlideLayout(`layout${partDigit(part, 'slideLayout')}`, part, xml, rels, ctx.logger);
  }));

  // Step 5: slides
  const slides = await Promise.all(ct.slideParts.map(async (part) => {
    const xml = await readZipText(part);
    const rels = await readZipRels(part);
    const slide = parseSlide(`slide${partDigit(part, 'slide')}`, part, xml, rels, ctx.logger);
    // 修2: SmartArt diagram → 解析缓存绘图形状(填进 graphicFrame.diagramShapes)
    await resolveDiagramShapes(slide, rels, readPartOrNull, ctx.logger);
    return slide;
  }));

  // relsGraph (slide → layout, slide → media)
  const relsGraph: RawIR['relsGraph'] = {};
  for (const slide of slides) {
    relsGraph[slide.id] = { layout: slide.layoutRef, media: slide.mediaRefs };
  }

  // D1: 收集 slide + layout + master 三层 mediaAssets (Plan 2A)
  // 下游 map key 是 (ownerKind::ownerId::embedId),所以必须每个 embedId 都产出一条 asset:
  // 同一 owner 内两个 rId 指向同一张图(internalPath 相同)时,旧的按 internalPath 去重会漏掉
  // 第二个 embedId → 它在 mediaUrlMap 里没条目 → 该 <img> src 解析为空(图裂)。
  // 改为:按 zipPath 缓存 buffer(只读一次,避免重复解压),但每个 embedId 都 push。
  const mediaAssets: RawMediaAsset[] = [];
  const bufferCache = new Map<string, Buffer>();
  async function collectFromLayer(ownerKind: 'slide' | 'layout' | 'master', ownerId: string, mediaRefs: Record<string, string>) {
    for (const [embedId, internalPath] of Object.entries(mediaRefs)) {
      const zipPath = internalPath.replace(/^\//, '');
      let buffer = bufferCache.get(zipPath);
      if (buffer === undefined) {
        const file = zip.file(zipPath);
        if (!file) continue;
        buffer = await file.async('nodebuffer');
        bufferCache.set(zipPath, buffer);
      }
      const ext = (internalPath.split('.').pop() || 'png').toLowerCase();
      const mimeType = ext === 'png' ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : ext === 'gif' ? 'image/gif'
        : ext === 'svg' ? 'image/svg+xml'
        : `image/${ext}`;
      mediaAssets.push({ embedId, internalPath, ext, mimeType, buffer, ownerKind, ownerId });
    }
  }

  for (const s of slides) await collectFromLayer('slide', s.id, s.mediaRefs);
  for (const l of layouts) await collectFromLayer('layout', l.id, l.mediaRefs);
  for (const m of masters) await collectFromLayer('master', m.id, m.mediaRefs);

  return { slideSize, masters, themes, layouts, slides, relsGraph, mediaAssets };
}
