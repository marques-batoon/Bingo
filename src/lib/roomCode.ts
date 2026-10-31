/** Room-code letters: no 0/O, 1/I/L, so codes read cleanly aloud and on small screens. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 4;

export function randomRoomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  // 256 isn't a multiple of 31, so the first few letters are very slightly likelier. Fine for room codes.
  return Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/** Uppercases and drops anything that can't be in a code (spaces, dashes, lookalikes). */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter(ch => CODE_ALPHABET.includes(ch))
    .join('')
    .slice(0, CODE_LENGTH);
}

export function isValidRoomCode(code: string): boolean {
  return code.length === CODE_LENGTH && normalizeRoomCode(code) === code;
}

export function joinLink(code: string): string {
  return `${location.origin}/join/${code}`;
}
