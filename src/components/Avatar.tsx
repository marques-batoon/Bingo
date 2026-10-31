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

/** Placeholder avatar: initials on a gradient circle. Phase 3 adds picked avatars. */
export default function Avatar({ name, seed, size = 44 }: { name: string; seed?: string; size?: number }) {
  const [a, b] = GRADIENTS[hash(seed || name) % GRADIENTS.length];
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-display font-extrabold text-white shadow-[inset_0_-2px_6px_rgb(0_0_0/0.25)]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        textShadow: '0 1px 2px rgb(0 0 0 / 0.3)',
      }}
    >
      {initials(name)}
    </div>
  );
}
