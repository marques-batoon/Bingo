import { CARD_COUNT, colorOf, type CardColorId } from './cards';
import { hashSeed, mulberry32, seededShuffle } from './random';
import type { CardPick, Picks, RoomMeta } from './types';

export const MAX_SLOTS = 8;
export const slotKey = (i: number) => `s${i}`;

/**
 * This player's own order for browsing the pool. Seeded by room + player,
 * so two players rarely see the same cards, and a reload shows the same order.
 */
export function browseOrder(code: string, playerId: string): number[] {
  const ids = Array.from({ length: CARD_COUNT }, (_, i) => i + 1);
  return seededShuffle(ids, mulberry32(hashSeed(`${code}:${playerId}`)));
}

/**
 * The next card in `order` after position `from` (wrapping around) that matches
 * `color` (any color if omitted) and isn't unavailable. Returns its position, or -1.
 */
export function nextCandidate(
  order: readonly number[],
  from: number,
  isUnavailable: (id: number) => boolean,
  color?: CardColorId,
): number {
  for (let step = 1; step <= order.length; step++) {
    const pos = (from + step) % order.length;
    const id = order[pos];
    if (color && colorOf(id).id !== color) continue;
    if (!isUnavailable(id)) return pos;
  }
  return -1;
}

export interface PickProgress {
  /** Picks confirmed for the current round and still held. */
  confirmed: number;
  needed: number;
  /** Picks beyond the card count (host lowered it): the player must remove these. */
  extra: number;
  /** Picks held from an earlier round that still need Keep or Replace. */
  pendingKeep: number;
  done: boolean;
}

export function isPickCurrent(pick: CardPick, meta: RoomMeta, claims: Record<string, string> | undefined, playerId: string) {
  return pick.round === meta.round && claims?.[pick.cardId] === playerId;
}

export function pickProgress(
  picks: Picks | undefined,
  meta: RoomMeta,
  claims: Record<string, string> | undefined,
  playerId: string,
): PickProgress {
  const list = Object.values(picks ?? {});
  const held = list.filter(p => claims?.[p.cardId] === playerId);
  const confirmed = held.filter(p => p.round === meta.round).length;
  const needed = meta.cardsPerPlayer;
  const extra = Math.max(0, held.length - needed);
  return {
    confirmed: Math.min(confirmed, needed),
    needed,
    extra,
    pendingKeep: held.length - confirmed,
    done: confirmed === needed && held.length === needed,
  };
}

/** First unused slot key, or null if all 8 are taken. */
export function freeSlotKey(picks: Picks | undefined): string | null {
  for (let i = 0; i < MAX_SLOTS; i++) if (!picks?.[slotKey(i)]) return slotKey(i);
  return null;
}

/** Slot keys in a stable display order (s0, s1, …). */
export function sortedPickEntries(picks: Picks | undefined): [string, CardPick][] {
  return Object.entries(picks ?? {}).sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)));
}
