import { describe, expect, it } from 'vitest';
import { AVATAR_CATEGORIES, AVATARS, avatarKey, avatarsIn, findAvatar } from './avatars';

describe('avatar manifest', () => {
  it('has Fruit, Vegetables and Animals, 15 each', () => {
    expect(AVATAR_CATEGORIES.map(c => c.id)).toEqual(['fruit', 'vegetables', 'animals']);
    for (const c of AVATAR_CATEGORIES) expect(avatarsIn(c.id)).toHaveLength(15);
  });

  it('has unique keys that fit the database rule (48 chars)', () => {
    const keys = AVATARS.map(avatarKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k.length).toBeLessThanOrEqual(48);
  });

  it('gives each avatar an emoji', () => {
    for (const a of AVATARS) expect(a.emoji).toBeTruthy();
  });

  it('looks avatars up by key', () => {
    expect(findAvatar('animals/panda')?.name).toBe('Panda');
    // Avatars from removed categories fall back to initials.
    expect(findAvatar('pokemon/pikachu')).toBeUndefined();
  });
});
