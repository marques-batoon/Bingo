/** Card height ÷ width for BingoCardView (header + 5×5 grid + footer). */
export const CARD_ASPECT = 1.22;
export const CARD_GAP = 10;

/** Best column count and card width for `count` cards in a w×h box. */
export function fitCards(count: number, w: number, h: number, gap = CARD_GAP): { cols: number; cardW: number } {
  let best = { cols: 1, cardW: 0 };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const byW = (w - gap * (cols - 1)) / cols;
    const byH = (h - gap * (rows - 1)) / rows / CARD_ASPECT;
    const cardW = Math.floor(Math.min(byW, byH));
    if (cardW > best.cardW) best = { cols, cardW };
  }
  return best;
}

/** Splits items into pages of `perPage` (0 = one page with everything). */
export function paginate<T>(items: T[], perPage: number): T[][] {
  const per = perPage > 0 ? perPage : Math.max(1, items.length);
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += per) pages.push(items.slice(i, i + per));
  return pages.length ? pages : [[]];
}
