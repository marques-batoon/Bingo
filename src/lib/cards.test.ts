import { describe, expect, it } from 'vitest';
import {
  CARD_COLORS,
  CARD_COUNT,
  CARDS_PER_COLOR,
  FREE,
  cellAt,
  colorOf,
  columnRange,
  getCard,
  letterFor,
} from './cards';

const all = Array.from({ length: CARD_COUNT }, (_, i) => getCard(i + 1));

describe('card pool', () => {
  it('has 3,003 cards', () => {
    expect(CARD_COUNT).toBe(3003);
    expect(all).toHaveLength(3003);
  });

  it('every card is unique', () => {
    const keys = new Set(all.map(c => c.columns.map(col => col.join(',')).join('|')));
    expect(keys.size).toBe(CARD_COUNT);
  });

  it('has 429 cards of each of the 7 colors', () => {
    const counts = new Map<string, number>();
    for (const c of all) counts.set(c.color.id, (counts.get(c.color.id) ?? 0) + 1);
    expect(counts.size).toBe(7);
    for (const color of CARD_COLORS) expect(counts.get(color.id)).toBe(CARDS_PER_COLOR);
  });

  it('keeps every number in its column range with no repeats', () => {
    for (const card of all) {
      card.columns.forEach((col, ci) => {
        const [lo, hi] = columnRange(ci);
        const nums = col.filter(n => n !== FREE);
        expect(nums).toHaveLength(ci === 2 ? 4 : 5);
        expect(new Set(nums).size).toBe(nums.length);
        for (const n of nums) {
          expect(n).toBeGreaterThanOrEqual(lo);
          expect(n).toBeLessThanOrEqual(hi);
        }
      });
    }
  });

  it('has FREE only in the center', () => {
    for (const card of all) {
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 5; c++) expect(cellAt(card, r, c) === FREE).toBe(r === 2 && c === 2);
    }
  });

  it('is deterministic (same ID → same card)', () => {
    // If this fails, the generator changed and every player's cards would change.
    expect(getCard(1).columns).toEqual(all[0].columns);
    const fingerprint = all.reduce((h, c) => (h * 31 + c.columns.flat().reduce((a, b) => a * 7 + b, 0)) % 1_000_000_007, 0);
    expect(fingerprint).toMatchSnapshot();
  });

  it('maps colors and letters', () => {
    expect(colorOf(1).id).toBe('red');
    expect(colorOf(429).id).toBe('red');
    expect(colorOf(430).id).toBe('blue');
    expect(colorOf(3003).id).toBe('cyan');
    expect(letterFor(1)).toBe('B');
    expect(letterFor(45)).toBe('N');
    expect(letterFor(75)).toBe('O');
  });

  it('rejects bad IDs', () => {
    expect(() => getCard(0)).toThrow();
    expect(() => getCard(3004)).toThrow();
  });
});
