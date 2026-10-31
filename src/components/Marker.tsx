import { MARKER_OPACITY } from '../lib/markers';

/** A Bingo dauber mark: a semi-transparent disc so the number underneath stays readable. */
export default function Marker({ color, className = '' }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none block rounded-full ${className}`}
      style={{
        opacity: MARKER_OPACITY,
        background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 70%, white), ${color} 60%)`,
        boxShadow: `inset 0 -2px 4px rgb(0 0 0 / 0.18)`,
      }}
    />
  );
}
