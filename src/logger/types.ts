// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

export interface RuleSource {
  mappingDoc: string;        // 如 "mapping.md 第 2.1 节"
  mappingDocLine: number;
  decisionDoc: string;       // 如 "undecided-resolved.md #23"
  officialRef: string;       // OOXML 官方元素名
}

export interface RuleApplyEvent {
  decisionId: string;
  ruleName: string;
  source: RuleSource;
  context: { slideRef?: string; shapeId?: string; element: string };
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface WarnEvent {
  decisionId?: string;
  message: string;
  context: { slideRef?: string; element?: string };
  reason?: string;
}

export interface ErrorEvent {
  decisionId?: string;
  message: string;
  context: { slideRef?: string; element?: string };
  stack?: string;
}

export interface RuleLogger {
  apply(event: RuleApplyEvent): void;
  warn(event: WarnEvent): void;
  error(event: ErrorEvent): void;
}
