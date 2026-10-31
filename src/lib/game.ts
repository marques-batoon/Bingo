import { ref, serverTimestamp, update } from 'firebase/database';
import { verifyWin, type WinKind } from './bingo';
import { getCard } from './cards';
import { drawNumber } from './draw';
import { getDb } from './firebase';
import type { GameState, MarkPos, Room, WinnerEntry } from './types';

/** Called numbers in call order. */
export function calledNumbers(game: GameState | undefined): number[] {
  return Object.values(game?.calls ?? {})
    .sort((a, b) => a.i - b.i)
    .map(c => c.n);
}

export const callKey = (i: number) => `c${i}`;
export const cellKey = (cell: number) => `c${cell}`;

/**
 * Host: draws the next number on this device and writes it with its call index.
 * The rules refuse rewriting an existing index, so a double tap can't skip a ball.
 */
export async function callNextNumber(code: string, game: GameState | undefined): Promise<number> {
  const called = calledNumbers(game);
  const n = drawNumber(called);
  const i = called.length;
  await update(ref(getDb(), `rooms/${code}/game/calls/${callKey(i)}`), { n, i, at: serverTimestamp() });
  return n;
}

/** Most a marker may move from center, as a fraction of its square, so it never leaves the square. */
export const MARK_MAX_OFFSET = 0.14;

export function clampOffset(v: number): number {
  return Math.round(Math.max(-MARK_MAX_OFFSET, Math.min(MARK_MAX_OFFSET, v)) * 1000) / 1000;
}

export async function setMark(code: string, uid: string, cardId: number, cell: number, pos: MarkPos) {
  await update(ref(getDb(), `rooms/${code}/marks/${uid}/${cardId}/${cellKey(cell)}`), {
    x: clampOffset(pos.x),
    y: clampOffset(pos.y),
  });
}

/** Player: claims Bingo or Blackout on a card, tagged with the latest call they've seen. */
export async function claimWin(code: string, uid: string, kind: WinKind, cardId: number, callIndex: number) {
  await update(ref(getDb(), `rooms/${code}/${kind === 'bingo' ? 'bingos' : 'blackouts'}/${uid}`), {
    cardId,
    i: callIndex,
    at: serverTimestamp(),
  });
}

export const winnerKey = (kind: WinKind, uid: string) => `${kind}_${uid}`;

/**
 * Identifies a claim by card and call index (not its timestamp: a server timestamp
 * changes once from the local estimate to the real value, which would look like a new claim).
 */
export const claimKeyOf = (claim: { cardId: number; i: number }) => `${claim.cardId}:${claim.i}`;

/**
 * Host: checks every claim that hasn't been checked yet against the calls made up
 * to the claim's call index, and records the verdict. Returns how many it checked.
 */
export async function verifyClaims(code: string, room: Room): Promise<number> {
  const calls = calledNumbers(room.game);
  const changes: Record<string, WinnerEntry> = {};
  for (const kind of ['bingo', 'blackout'] as const) {
    const claims = (kind === 'bingo' ? room.bingos : room.blackouts) ?? {};
    for (const [uid, claim] of Object.entries(claims)) {
      const key = winnerKey(kind, uid);
      if (room.game?.winners?.[key]?.claimKey === claimKeyOf(claim)) continue;
      const calledByClaim = new Set(calls.slice(0, claim.i + 1));
      const ok =
        room.claims?.[claim.cardId] === uid &&
        verifyWin(kind, getCard(claim.cardId), room.marks?.[uid]?.[claim.cardId], calledByClaim);
      changes[`rooms/${code}/game/winners/${key}`] = { uid, kind, cardId: claim.cardId, i: claim.i, ok, claimKey: claimKeyOf(claim) };
    }
  }
  const count = Object.keys(changes).length;
  if (count) await update(ref(getDb()), changes);
  return count;
}

/** Host: after a Bingo, keep playing for a full card. */
export async function continueToBlackout(code: string) {
  await update(ref(getDb(), `rooms/${code}/game`), { mode: 'blackout' });
}

/** Host: ends the game (any time). */
export async function endGame(code: string) {
  await update(ref(getDb()), {
    [`rooms/${code}/meta/status`]: 'over',
    [`rooms/${code}/game/endedAt`]: serverTimestamp(),
  });
}

/**
 * Host: back to the lobby for another round. Clears calls, marks and claims of
 * Bingo; keeps players, their settings and their card picks (which then need
 * Keep or Replace, since the round number goes up).
 */
export async function returnToLobby(code: string, room: Room) {
  const changes: Record<string, unknown> = {
    [`rooms/${code}/meta/status`]: 'lobby',
    [`rooms/${code}/meta/round`]: room.meta.round + 1,
    [`rooms/${code}/game`]: null,
  };
  for (const uid of Object.keys(room.marks ?? {})) changes[`rooms/${code}/marks/${uid}`] = null;
  for (const uid of Object.keys(room.bingos ?? {})) changes[`rooms/${code}/bingos/${uid}`] = null;
  for (const uid of Object.keys(room.blackouts ?? {})) changes[`rooms/${code}/blackouts/${uid}`] = null;
  await update(ref(getDb()), changes);
}
