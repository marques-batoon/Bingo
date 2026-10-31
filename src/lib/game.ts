import { ref, serverTimestamp, update } from 'firebase/database';
import { drawNumber } from './draw';
import { getDb } from './firebase';
import type { GameState, MarkPos } from './types';

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
