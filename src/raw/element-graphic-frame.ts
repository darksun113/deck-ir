import type { RawGraphicFrame } from '../ir/raw';
import { attr } from './_shared-csld';
import { parseXfrm } from './element-sp';

type XmlNode = Record<string, unknown>;

export function parseGraphicFrame(gfNode: XmlNode): RawGraphicFrame {
  const nvGraphicFramePr = gfNode['p:nvGraphicFramePr'] as XmlNode | undefined;
  const cNvPr = nvGraphicFramePr?.['p:cNvPr'] as XmlNode | undefined;
  const xfrmNode = gfNode['p:xfrm'] as XmlNode | undefined;
  const graphic = gfNode['a:graphic'] as XmlNode | undefined;
  const graphicData = graphic?.['a:graphicData'] as XmlNode | undefined;
  // 修2: SmartArt diagram 的 dgm:relIds r:dm(指向 dataN.xml 的关系 id)
  const relIds = graphicData?.['dgm:relIds'] as XmlNode | undefined;
  const diagramRelId = relIds?.['@_r:dm'] as string | undefined;

  return {
    kind: 'graphicFrame',
    id: attr(cNvPr, 'id') ?? '',
    name: attr(cNvPr, 'name'),
    xfrm: parseXfrm(xfrmNode),
    uri: attr(graphicData, 'uri') ?? 'unknown',
    diagramRelId,
  };
}
