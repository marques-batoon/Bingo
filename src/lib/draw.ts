export const BALL_COUNT = 75;

/** Uniform random integer in [0, max) from the browser's crypto RNG (rejection sampling, no modulo bias). */
export function secureRandomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

/** Numbers 1–75 not called yet. */
export function remainingNumbers(called: Iterable<number>): number[] {
  const done = new Set(called);
  const out: number[] = [];
  for (let n = 1; n <= BALL_COUNT; n++) if (!done.has(n)) out.push(n);
  return out;
}

/** Draws the next ball from the ones left. Throws when all 75 are out. */
export function drawNumber(called: Iterable<number>, randomInt: (max: number) => number = secureRandomInt): number {
  const left = remainingNumbers(called);
  if (left.length === 0) throw new Error('All 75 numbers have been called.');
  return left[randomInt(left.length)];
}
