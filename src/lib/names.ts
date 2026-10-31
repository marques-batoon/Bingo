export const NAME_MAX = 16;

const ADJECTIVES = ['Lucky', 'Sunny', 'Zippy', 'Cosmic', 'Jolly', 'Brave', 'Swift', 'Cheery', 'Mighty', 'Snappy', 'Witty', 'Bouncy'];
const NOUNS = ['Mango', 'Otter', 'Comet', 'Panda', 'Tiger', 'Ube', 'Koala', 'Pepper', 'Falcon', 'Lemon', 'Gecko', 'Nova'];

export function randomPlayerName(): string {
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

/** Trims, collapses spaces, and caps the length. Returns '' if nothing usable is left. */
export function cleanName(input: string): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}
