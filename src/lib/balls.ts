import { letterFor } from './cards';

/** Bingo ball colors per letter (also used on the Home screen). */
export const BALL_STYLES: Record<string, { from: string; to: string }> = {
  B: { from: '#4cc3ff', to: '#2f7bff' },
  I: { from: '#ff5d73', to: '#d8335a' },
  N: { from: '#f4f2ff', to: '#b9b3dd' },
  G: { from: '#3ee0a8', to: '#13a874' },
  O: { from: '#ffc94a', to: '#ff8a3d' },
};

export function ballStyle(n: number) {
  return BALL_STYLES[letterFor(n)];
}
