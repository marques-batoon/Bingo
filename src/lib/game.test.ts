import { describe, expect, it } from 'vitest';
import { MARK_MAX_OFFSET, calledNumbers, clampOffset } from './game';

describe('game helpers', () => {
  it('orders calls by index', () => {
    expect(
      calledNumbers({ round: 1, startedAt: 0, calls: { c2: { n: 9, i: 2, at: 0 }, c0: { n: 40, i: 0, at: 0 }, c1: { n: 3, i: 1, at: 0 } } }),
    ).toEqual([40, 3, 9]);
    expect(calledNumbers(undefined)).toEqual([]);
  });

  it('keeps markers inside their own square', () => {
    expect(clampOffset(0.5)).toBe(MARK_MAX_OFFSET);
    expect(clampOffset(-9)).toBe(-MARK_MAX_OFFSET);
    expect(clampOffset(0.05123)).toBe(0.051);
  });
});
