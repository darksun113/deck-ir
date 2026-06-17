import type { RawGroupShape, RawShape, RawPicture, RawGraphicFrame } from '../ir/raw';
import { toArray, attr } from './_shared-csld';
import { parseShape, parseXfrm, parseConnector } from './element-sp';
import { parsePicture, type PictureCtx } from './element-pic';
import { parseGraphicFrame } from './element-graphic-frame';

type XmlNode = Record<string, unknown>;

export function parseGroupShape(grpNode: XmlNode, ctx: PictureCtx): RawGroupShape {
  const nvGrpSpPr = grpNode['p:nvGrpSpPr'] as XmlNode | undefined;
  const cNvPr = nvGrpSpPr?.['p:cNvPr'] as XmlNode | undefined;
  const grpSpPr = grpNode['p:grpSpPr'] as XmlNode | undefined;

  return {
    kind: 'grpSp',
    id: attr(cNvPr, 'id') ?? '',
    name: attr(cNvPr, 'name'),
    xfrm: parseXfrm(grpSpPr?.['a:xfrm'] as XmlNode | undefined),
    children: parseGrpChildren(grpNode, ctx),
  };
}

function parseGrpChildren(grpNode: XmlNode, ctx: PictureCtx): Array<RawShape | RawPicture | RawGroupShape | RawGraphicFrame> {
  const out: Array<RawShape | RawPicture | RawGroupShape | RawGraphicFrame> = [];
  for (const sp of toArray(grpNode['p:sp'])) out.push(parseShape(sp as XmlNode, { logger: ctx.logger, slideRef: ctx.slideRef, custGeomPaths: ctx.custGeomPaths }));
  for (const cxn of toArray(grpNode['p:cxnSp'])) out.push(parseConnector(cxn as XmlNode, { logger: ctx.logger, slideRef: ctx.slideRef, custGeomPaths: ctx.custGeomPaths }));
  for (const pic of toArray(grpNode['p:pic'])) out.push(parsePicture(pic as XmlNode, ctx));
  for (const inner of toArray(grpNode['p:grpSp'])) out.push(parseGroupShape(inner as XmlNode, ctx));
  for (const gf of toArray(grpNode['p:graphicFrame'])) out.push(parseGraphicFrame(gf as XmlNode));
  if (ctx.orderIndex) {
    out.sort((a, b) => (ctx.orderIndex!.get(a.id) ?? 0) - (ctx.orderIndex!.get(b.id) ?? 0));
  }
  return out;
}
