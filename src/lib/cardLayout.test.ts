import { describe, expect, it } from 'vitest';
import { CARD_ASPECT, fitCards, paginate } from './cardLayout';

describe('card layout', () => {
  it('splits 5 cards at 3 per page into 3 + 2', () => {
    expect(paginate([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
    expect(paginate([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
    expect(paginate([1, 2], 1)).toEqual([[1], [2]]);
  });

  it('fits cards without overflowing the box (iPhone portrait)', () => {
    const w = 375 - 24, h = 520;
    for (let n = 1; n <= 8; n++) {
      const { cols, cardW } = fitCards(n, w, h);
      const rows = Math.ceil(n / cols);
      expect(cols * cardW + (cols - 1) * 10).toBeLessThanOrEqual(w);
      expect(rows * cardW * CARD_ASPECT + (rows - 1) * 10).toBeLessThanOrEqual(h + 1);
      expect(cardW).toBeGreaterThan(80);
    }
  });

  it('uses one big card when there is one', () => {
    expect(fitCards(1, 351, 520).cols).toBe(1);
    expect(fitCards(1, 351, 520).cardW).toBe(351);
  });
});
