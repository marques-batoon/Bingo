export const NAME_MAX = 16;

const ADJECTIVES = ['Lucky', 'Stinky', 'Zippy', 'Powerful', 'Fantastic', 'Brave', 'Yummy', 'Mister', 'Vinegar', 'Japanese', 'Di ko kaya', 'Winner'];
const NOUNS = ['Mango', 'Kilikili', 'Chili', 'Kimiko', 'Fabro', 'Ube', 'Jace', 'Balut', 'Bombastic', 'Armpit', 'Flower', 'Otso Otso'];

export function randomPlayerName(): string {
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

/** Trims, collapses spaces, and caps the length. Returns '' if nothing usable is left. */
export function cleanName(input: string): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}
