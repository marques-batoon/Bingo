import { FREE, cellAt, type BingoCard } from './cards';
import type { CardMarks } from './types';

/** The 12 winning lines as cell indexes (row * 5 + col): 5 rows, 5 columns, 2 diagonals. */
export const LINES: number[][] = [
  ...Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r * 5 + c)),
  ...Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export const FREE_CELL = 12;

const cellKey = (cell: number) => `c${cell}`;

/** Which squares count as marked: the player's own markers plus FREE (always). */
export function markedCells(marks: CardMarks | undefined): boolean[] {
  return Array.from({ length: 25 }, (_, cell) => cell === FREE_CELL || Boolean(marks?.[cellKey(cell)]));
}

export function completedLines(marked: boolean[]): number[][] {
  return LINES.filter(line => line.every(cell => marked[cell]));
}

export function hasBingo(marks: CardMarks | undefined): boolean {
  return completedLines(markedCells(marks)).length > 0;
}

export function isBlackout(marks: CardMarks | undefined): boolean {
  return markedCells(marks).every(Boolean);
}

export type WinKind = 'bingo' | 'blackout';

/**
 * Host check of a claim: the claimed pattern must be complete using only squares
 * whose numbers had been called by the claim's call index (FREE always counts).
 */
export function verifyWin(kind: WinKind, card: BingoCard, marks: CardMarks | undefined, calledByClaim: Set<number>): boolean {
  const valid = Array.from({ length: 25 }, (_, cell) => {
    if (cell === FREE_CELL) return true;
    if (!marks?.[cellKey(cell)]) return false;
    const n = cellAt(card, Math.floor(cell / 5), cell % 5);
    return n !== FREE && calledByClaim.has(n);
  });
  return kind === 'blackout' ? valid.every(Boolean) : completedLines(valid).length > 0;
}
