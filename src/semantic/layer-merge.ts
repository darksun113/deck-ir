import type { RawShape, RawPicture, RawGroupShape, RawGraphicFrame, RawCSld } from '../ir/raw';

type RawSpTreeChild = RawShape | RawPicture | RawGroupShape | RawGraphicFrame;
type SpTree = RawCSld['spTree'];

export interface MergeOpts {
  showMaster: boolean;  // 来自 SlideLineage.effectiveShowMasterSp
  masterId: string;
  layoutId: string;
  slideId: string;
}

export interface TaggedChild {
  child: RawSpTreeChild;
  ownerKind: 'master' | 'layout' | 'slide';
  ownerId: string;
}

export function mergeLayerDecorations(
  master: SpTree,
  layout: SpTree,
  slide: SpTree,
  opts: MergeOpts
): TaggedChild[] {
  const result: TaggedChild[] = [];
  if (opts.showMaster) {
    result.push(...master.children.map((c) => ({ child: c, ownerKind: 'master' as const, ownerId: opts.masterId })));
    result.push(...layout.children.map((c) => ({ child: c, ownerKind: 'layout' as const, ownerId: opts.layoutId })));
  }
  result.push(...slide.children.map((c) => ({ child: c, ownerKind: 'slide' as const, ownerId: opts.slideId })));
  // z-index = document order: 先 push 的在底层, 后 push 的在顶层
  return result;
}
