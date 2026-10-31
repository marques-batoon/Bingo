import { hashSeed, mulberry32, seededShuffle } from './random';

/**
 * The card pool: 3,003 standard US 75-ball cards, 429 in each of 7 colors.
 * Cards are derived from a fixed seed, so every device computes the identical
 * card from its ID and nothing about cards is stored in the database.
 * Changing CARD_SEED (or the algorithm) changes every card: don't, once people play.
 */
export const CARD_SEED = 'marques-bingo-cards-v1';

export const CARD_COLORS = [
  { id: 'red', name: 'Red', bg: '#e23d4b', text: '#ffffff' },
  { id: 'blue', name: 'Blue', bg: '#2f6bff', text: '#ffffff' },
  { id: 'green', name: 'Green', bg: '#1f9d55', text: '#ffffff' },
  { id: 'black', name: 'Black', bg: '#17151f', text: '#ffffff' },
  { id: 'purple', name: 'Purple', bg: '#7b3fe4', text: '#ffffff' },
  { id: 'orange', name: 'Orange', bg: '#ff8a1f', text: '#1a1206' },
  { id: 'cyan', name: 'Cyan', bg: '#19c3e6', text: '#06222a' },
] as const;

export type CardColor = (typeof CARD_COLORS)[number];
export type CardColorId = CardColor['id'];

export const CARDS_PER_COLOR = 429;
export const CARD_COUNT = CARDS_PER_COLOR * CARD_COLORS.length; // 3003
export const FREE = 0;
export const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

export interface BingoCard {
  /** 1–3003 */
  id: number;
  color: CardColor;
  /** columns[col][row]; B=0 … O=4. The center (columns[2][2]) is FREE (0). */
  columns: number[][];
}

/** Column `col` holds numbers col*15+1 … col*15+15. */
export function columnRange(col: number): [number, number] {
  return [col * 15 + 1, col * 15 + 15];
}

export function letterFor(n: number): string {
  return LETTERS[Math.floor((n - 1) / 15)];
}

/** Colors go in blocks: IDs 1–429 Red, 430–858 Blue, … */
export function colorOf(id: number): CardColor {
  return CARD_COLORS[Math.floor((id - 1) / CARDS_PER_COLOR)];
}

function pickColumn(col: number, count: number, rand: () => number): number[] {
  const [lo] = columnRange(col);
  return seededShuffle(Array.from({ length: 15 }, (_, i) => lo + i), rand).slice(0, count);
}

function cardKey(columns: number[][]) {
  return columns.map(c => c.join(',')).join('|');
}

let pool: number[][][] | null = null;

/** Builds all cards once (a few ms), skipping any repeat so every card is unique. */
function buildPool(): number[][][] {
  const rand = mulberry32(hashSeed(CARD_SEED));
  const seen = new Set<string>();
  const cards: number[][][] = [];
  while (cards.length < CARD_COUNT) {
    const columns = LETTERS.map((_, col) => pickColumn(col, col === 2 ? 4 : 5, rand));
    columns[2].splice(2, 0, FREE);
    const key = cardKey(columns);
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(columns);
  }
  return cards;
}

export function isValidCardId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= CARD_COUNT;
}

export function getCard(id: number): BingoCard {
  if (!isValidCardId(id)) throw new Error(`No card ${id}`);
  pool ??= buildPool();
  return { id, color: colorOf(id), columns: pool[id - 1] };
}

/** Card number in grid order: row by row, left to right. */
export function cellAt(card: BingoCard, row: number, col: number): number {
  return card.columns[col][row];
}

/** Display label, e.g. "#0042". */
export function cardLabel(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}
