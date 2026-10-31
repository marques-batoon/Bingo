import { describe, expect, it } from 'vitest';
import { CARD_COUNT, colorOf } from './cards';
import { browseOrder, freeSlotKey, nextCandidate, pickProgress } from './cardSelection';
import type { RoomMeta } from './types';

const meta = (over: Partial<RoomMeta> = {}): RoomMeta => ({
  hostId: 'h', createdAt: 0, status: 'lobby', round: 2, cardsPerPlayer: 2, ...over,
});

describe('browse order', () => {
  it('is a full, repeatable permutation per player', () => {
    const a = browseOrder('ABCD', 'p1');
    expect(new Set(a).size).toBe(CARD_COUNT);
    expect(browseOrder('ABCD', 'p1')).toEqual(a);
  });

  it('differs between players and rooms', () => {
    const a = browseOrder('ABCD', 'p1');
    expect(browseOrder('ABCD', 'p2').slice(0, 20)).not.toEqual(a.slice(0, 20));
    expect(browseOrder('WXYZ', 'p1').slice(0, 20)).not.toEqual(a.slice(0, 20));
  });
});

describe('nextCandidate', () => {
  const order = browseOrder('ABCD', 'p1');

  it('skips claimed cards', () => {
    const claimed = new Set([order[0], order[1]]);
    expect(order[nextCandidate(order, -1, id => claimed.has(id))]).toBe(order[2]);
  });

  it('filters by color and wraps around', () => {
    const pos = nextCandidate(order, order.length - 1, () => false, 'cyan');
    expect(colorOf(order[pos]).id).toBe('cyan');
  });

  it('returns -1 when nothing is left', () => {
    expect(nextCandidate(order, 0, () => true)).toBe(-1);
  });
});

describe('pickProgress (claim conflicts)', () => {
  it('counts only picks this player still holds for this round', () => {
    const picks = { s0: { cardId: 5, round: 2 }, s1: { cardId: 9, round: 2 } };
    // Card 9's claim belongs to someone else (lost a race): it doesn't count.
    const p = pickProgress(picks, meta(), { 5: 'me', 9: 'other' }, 'me');
    expect(p).toMatchObject({ confirmed: 1, needed: 2, done: false });
  });

  it('needs re-confirmation after a new round', () => {
    const picks = { s0: { cardId: 5, round: 1 }, s1: { cardId: 9, round: 2 } };
    const p = pickProgress(picks, meta(), { 5: 'me', 9: 'me' }, 'me');
    expect(p).toMatchObject({ confirmed: 1, pendingKeep: 1, done: false });
  });

  it('flags extra cards when the host lowers the count', () => {
    const picks = { s0: { cardId: 5, round: 2 }, s1: { cardId: 9, round: 2 }, s2: { cardId: 11, round: 2 } };
    const p = pickProgress(picks, meta(), { 5: 'me', 9: 'me', 11: 'me' }, 'me');
    expect(p).toMatchObject({ confirmed: 2, extra: 1, done: false });
  });

  it('is done when exactly the right cards are confirmed', () => {
    const picks = { s0: { cardId: 5, round: 2 }, s3: { cardId: 9, round: 2 } };
    expect(pickProgress(picks, meta(), { 5: 'me', 9: 'me' }, 'me').done).toBe(true);
  });

  it('finds the first free slot', () => {
    expect(freeSlotKey(undefined)).toBe('s0');
    expect(freeSlotKey({ s0: { cardId: 1, round: 1 }, s2: { cardId: 2, round: 1 } })).toBe('s1');
  });
});
