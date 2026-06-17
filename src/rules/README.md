# Parser v2 Rules 索引

> 64 条决策的实施位置。详细决策见 [追踪文档](../../../../../docs/superpowers/specs/2026-06-08-ooxml-undecided-resolved.md) §A 按 OOXML 元素索引。

## 必读
- [Parser v2 设计](../../../../../docs/superpowers/specs/2026-06-08-pptx-parser-v2-design.md) §0 配套文档 + §3.4 Pipeline + §4 规则标准格式
- [映射手册](../../../../../docs/superpowers/specs/2026-06-08-ooxml-to-html-mapping.md) 🎯 subagent 快查导航

## 不变约束
1. 每条规则函数必须配套 `*.test.ts`
2. 每条规则的 META 必须含 source 四元组(mappingDoc + mappingDocLine + decisionDoc + officialRef)
3. 每条规则必须 logger.apply()
4. 涉及 🔄 双向同步约束的修改两节同步
