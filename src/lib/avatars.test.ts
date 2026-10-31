import { describe, expect, it } from 'vitest';
import { AVATAR_CATEGORIES, AVATARS, avatarKey, avatarsIn, findAvatar } from './avatars';

describe('avatar manifest', () => {
  it('has 6 categories of 15', () => {
    expect(AVATAR_CATEGORIES).toHaveLength(6);
    for (const c of AVATAR_CATEGORIES) expect(avatarsIn(c.id)).toHaveLength(15);
  });

  it('has unique keys that fit the database rule (48 chars)', () => {
    const keys = AVATARS.map(avatarKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k.length).toBeLessThanOrEqual(48);
  });

  it('gives each avatar an image path or an emoji', () => {
    for (const a of AVATARS) {
      if (a.image) expect(a.image).toBe(`/avatars/${a.category}/${a.id}.webp`);
      else expect(a.emoji).toBeTruthy();
    }
  });

  it('looks avatars up by key', () => {
    expect(findAvatar('pokemon/pikachu')?.name).toBe('Pikachu');
    expect(findAvatar('nope/x')).toBeUndefined();
  });
});
