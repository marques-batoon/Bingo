import { useState } from 'react';
import { findAvatar } from '../lib/avatars';

const GRADIENTS = [
  ['#ff5d73', '#ff8a3d'],
  ['#9b7bff', '#4cc3ff'],
  ['#3ee0a8', '#4cc3ff'],
  ['#ffc94a', '#ff5d73'],
  ['#4cc3ff', '#9b7bff'],
  ['#ff8a3d', '#ffc94a'],
  ['#ff6fd8', '#9b7bff'],
  ['#3ee0a8', '#ffc94a'],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Image paths that failed to load (file not added yet), so we don't retry them on every render.
const missing = new Set<string>();

interface Props {
  /** Player name, used for the placeholder when no avatar is picked. */
  name: string;
  /** "<category>/<id>" from avatars.json, or '' for none. */
  avatarId?: string;
  /** Keeps a player's placeholder color stable (e.g. their player ID). */
  seed?: string;
  size?: number;
}

/**
 * A round avatar. Picked image avatars show your own file from public/avatars when it
 * exists, otherwise a polished initials placeholder. Fruit and Vegetables show emoji.
 */
export default function Avatar({ name, avatarId, seed, size = 44 }: Props) {
  const def = findAvatar(avatarId);
  const [, rerender] = useState(0);
  const label = def?.name ?? name;
  const [a, b] = GRADIENTS[hash(def ? avatarId! : seed || name) % GRADIENTS.length];
  const showImage = def?.image && !missing.has(def.image);

  return (
    <div
      aria-hidden
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-extrabold text-white shadow-[inset_0_-2px_6px_rgb(0_0_0/0.25)]"
      style={{
        width: size,
        height: size,
        fontSize: def?.emoji ? size * 0.56 : size * 0.38,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        textShadow: '0 1px 2px rgb(0 0 0 / 0.3)',
      }}
    >
      {def?.emoji ?? initials(label)}
      {showImage && (
        <img
          src={def.image}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover"
          onError={() => {
            missing.add(def.image!);
            rerender(n => n + 1);
          }}
        />
      )}
    </div>
  );
}
