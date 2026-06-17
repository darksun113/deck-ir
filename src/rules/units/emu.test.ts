// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Kelvin Gao <mtion@msn.com>

import { describe, it, expect } from 'vitest';
import { emuToPx, emuToPt, emuToInch, ptToPx } from './emu';

describe('emu unit conversion', () => {
  it('EMU → px (1 inch = 914400 EMU = 96 px)', () => {
    expect(emuToPx(9525)).toBe(1);
    expect(emuToPx(914400)).toBe(96);
  });
  it('EMU → pt (1 pt = 12700 EMU)', () => {
    expect(emuToPt(12700)).toBe(1);
  });
  it('EMU → inch (1 inch = 914400 EMU)', () => {
    expect(emuToInch(914400)).toBe(1);
  });
  it('pt → px (1 pt = 4/3 px)', () => {
    expect(ptToPx(72)).toBe(96);
  });
  it('emuToPx 接 logger 时打 apply 日志', () => {
    let captured: any;
    const logger = { apply: (e: any) => { captured = e; }, warn: () => {}, error: () => {} };
    emuToPx(9525, logger, { slideRef: 'slide1' });
    expect(captured.decisionId).toBe('#1');
    expect(captured.input.emu).toBe(9525);
    expect(captured.output.px).toBe(1);
    expect(captured.context.slideRef).toBe('slide1');
  });
});
