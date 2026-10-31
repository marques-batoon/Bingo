import manifest from '../data/avatars.json';

export interface AvatarDef {
  id: string;
  category: string;
  name: string;
  /** Your own image under public/avatars/<category>/<id>.webp (people/character categories). */
  image?: string;
  /** Fruit and Vegetables are emoji, complete out of the box. */
  emoji?: string;
}

export interface AvatarCategory {
  id: string;
  label: string;
}

export const AVATAR_CATEGORIES: AvatarCategory[] = manifest.categories;
export const AVATARS: AvatarDef[] = manifest.avatars;

/** Players store "<category>/<id>" so IDs only need to be unique within a category. */
export const avatarKey = (a: AvatarDef) => `${a.category}/${a.id}`;

const byKey = new Map(AVATARS.map(a => [avatarKey(a), a]));

export function findAvatar(key: string | undefined): AvatarDef | undefined {
  return key ? byKey.get(key) : undefined;
}

export function avatarsIn(category: string): AvatarDef[] {
  return AVATARS.filter(a => a.category === category);
}
