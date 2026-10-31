import { describe, expect, it } from 'vitest';
import { CODE_ALPHABET, CODE_LENGTH, isValidRoomCode, normalizeRoomCode, randomRoomCode } from './roomCode';

describe('room codes', () => {
  it('never uses lookalike characters', () => {
    for (const ch of '0O1IL') expect(CODE_ALPHABET).not.toContain(ch);
  });

  it('generates valid 4-character codes', () => {
    for (let i = 0; i < 2000; i++) {
      const code = randomRoomCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(isValidRoomCode(code)).toBe(true);
    }
  });

  it('normalizes typed input', () => {
    expect(normalizeRoomCode(' ab-c d ')).toBe('ABCD');
    expect(normalizeRoomCode('abcdef')).toBe('ABCD');
    expect(normalizeRoomCode('o0i1')).toBe('');
  });

  it('matches the pattern in database.rules.json', () => {
    const rulePattern = /^[A-HJKMNP-Z2-9]{4}$/;
    for (const ch of CODE_ALPHABET) expect(rulePattern.test(ch.repeat(4))).toBe(true);
  });
});
