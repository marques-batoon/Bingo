import { describe, expect, it } from 'vitest';
import { BALL_COUNT, drawNumber, remainingNumbers, secureRandomInt } from './draw';

describe('drawing numbers', () => {
  it('never repeats and covers all 75', () => {
    for (let game = 0; game < 50; game++) {
      const called: number[] = [];
      for (let i = 0; i < BALL_COUNT; i++) called.push(drawNumber(called));
      expect(new Set(called).size).toBe(BALL_COUNT);
      expect(Math.min(...called)).toBe(1);
      expect(Math.max(...called)).toBe(75);
    }
  });

  it('only draws from what is left', () => {
    const called = Array.from({ length: 74 }, (_, i) => i + 1); // 1–74
    expect(drawNumber(called)).toBe(75);
    expect(remainingNumbers(called)).toEqual([75]);
  });

  it('refuses when every number is out', () => {
    expect(() => drawNumber(Array.from({ length: 75 }, (_, i) => i + 1))).toThrow();
  });

  it('secureRandomInt stays in range', () => {
    for (let i = 0; i < 5000; i++) {
      const v = secureRandomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
  });
});
