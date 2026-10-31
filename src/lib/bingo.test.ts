import { describe, expect, it } from 'vitest';
import { FREE_CELL, LINES, hasBingo, isBlackout, verifyWin } from './bingo';
import { cellAt, getCard } from './cards';
import { cellKey } from './game';
import type { CardMarks } from './types';

const mark = (...cells: number[]): CardMarks => Object.fromEntries(cells.map(c => [cellKey(c), { x: 0, y: 0 }]));
const card = getCard(42);
const numberAt = (cell: number) => cellAt(card, Math.floor(cell / 5), cell % 5);
const calledFor = (cells: number[]) => new Set(cells.filter(c => c !== FREE_CELL).map(numberAt));

describe('bingo detection', () => {
  it('has 12 lines', () => expect(LINES).toHaveLength(12));

  it('detects every row', () => {
    for (let r = 0; r < 5; r++) expect(hasBingo(mark(...[0, 1, 2, 3, 4].map(c => r * 5 + c)))).toBe(true);
  });

  it('detects every column', () => {
    for (let c = 0; c < 5; c++) expect(hasBingo(mark(...[0, 1, 2, 3, 4].map(r => r * 5 + c)))).toBe(true);
  });

  it('detects both diagonals', () => {
    expect(hasBingo(mark(0, 6, 18, 24))).toBe(true); // FREE fills the center
    expect(hasBingo(mark(4, 8, 16, 20))).toBe(true);
  });

  it('counts FREE without a marker', () => {
    expect(hasBingo(mark(10, 11, 13, 14))).toBe(true); // middle row
    expect(hasBingo(mark(2, 7, 17, 22))).toBe(true); // N column
  });

  it('is not fooled by four in a row', () => {
    expect(hasBingo(mark(0, 1, 2, 3))).toBe(false);
    expect(hasBingo(mark(0, 5, 10, 15))).toBe(false);
    expect(hasBingo(undefined)).toBe(false);
  });

  it('detects blackout only when all 24 numbers are marked', () => {
    const all = Array.from({ length: 25 }, (_, i) => i).filter(i => i !== FREE_CELL);
    expect(isBlackout(mark(...all))).toBe(true);
    expect(isBlackout(mark(...all.slice(1)))).toBe(false);
  });
});

describe('host verification', () => {
  const row = [5, 6, 7, 8, 9];

  it('accepts a line whose numbers were all called', () => {
    expect(verifyWin('bingo', card, mark(...row), calledFor(row))).toBe(true);
  });

  it('rejects a line with a square marked before its number was called', () => {
    expect(verifyWin('bingo', card, mark(...row), calledFor(row.slice(1)))).toBe(false);
  });

  it('rejects a blackout with one square not called', () => {
    const all = Array.from({ length: 25 }, (_, i) => i);
    expect(verifyWin('blackout', card, mark(...all), calledFor(all))).toBe(true);
    expect(verifyWin('blackout', card, mark(...all), calledFor(all.slice(1)))).toBe(false);
  });
});
