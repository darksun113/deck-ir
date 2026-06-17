// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { XMLParser } from 'fast-xml-parser';

// preserveOrder 解析器: 每个元素节点是 { "<tag>": [children...], ":@"?: { "@_attr": "val" } }
// 父节点的 children array 是同级兄弟的数组
const _orderParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
});

/**
 * 解析 slide/layout/master XML, DFS 前序收集每个 p:cNvPr 的 @_id → 文档序号(z-order)。
 * 同容器内兄弟按出现序; DFS 前序保证兄弟相对序正确。
 *
 * preserveOrder 结构示例:
 *   父 children array 中的元素:
 *   { "p:cNvPr": [], ":@": { "@_id": "10", "@_name": "bg" } }
 *   — 即 tag name 是 key, ":@" 是同级的属性对象
 */
export function buildZOrderIndex(xml: string): Map<string, number> {
  const map = new Map<string, number>();
  // 从 1 起:排序 fallback `?? 0` 让缺 id 的元素(畸形 pptx)排到最底,不与第一个真实元素并列。
  let counter = 1;

  const walk = (nodes: unknown[]): void => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const rec = node as Record<string, unknown>;

      // 遍历该节点的所有 key
      for (const [key, val] of Object.entries(rec)) {
        if (key === ':@') continue; // 属性对象, 跳过

        if (key === 'p:cNvPr') {
          // 找到 cNvPr — 属性在同对象的 ':@' 中
          const attrs = (rec[':@'] as Record<string, unknown>) ?? {};
          const id = String(attrs['@_id'] ?? '');
          if (id) map.set(id, counter++);
          // cNvPr 通常是空节点, 但若有 children 也递归
          if (Array.isArray(val)) walk(val as unknown[]);
        } else {
          // 其他元素节点 — val 是 children array, 递归进入
          if (Array.isArray(val)) walk(val as unknown[]);
        }
      }
    }
  };

  walk(_orderParser.parse(xml) as unknown[]);
  return map;
}
