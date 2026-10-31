import { motion } from 'framer-motion';
import { BALL_STYLES } from '../lib/balls';

// Home / Game Over logo: G is orange here (in-game balls keep the standard letter colors).
const LOGO_STYLES = { ...BALL_STYLES, G: { from: '#ffb46b', to: '#f26a1b' } };
const BALLS = Object.entries(LOGO_STYLES).map(([letter, s]) => ({ letter, ...s }));
/** The O ball shows this photo instead of a letter. */
const O_PHOTO = '/balls/o.webp';

export default function BingoBalls({ size = 52 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {BALLS.map((b, i) => (
        <motion.div
          key={b.letter}
          initial={{ y: -24, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.08 * i }}
          className="relative grid place-items-center rounded-full"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 32% 28%, ${b.from}, ${b.to} 70%)`,
            boxShadow: `0 10px 22px -10px ${b.to}, inset 0 -4px 8px rgb(0 0 0 / 0.2)`,
          }}
        >
          {b.letter === 'O' ? (
            <img
              src={O_PHOTO}
              alt=""
              draggable={false}
              className="rounded-full object-cover ring-2 ring-white/80"
              style={{ width: size * 0.86, height: size * 0.86 }}
            />
          ) : (
            <div
              className="grid place-items-center rounded-full bg-white font-display font-black text-ink-950"
              style={{ width: size * 0.58, height: size * 0.58, fontSize: size * 0.34 }}
            >
              {b.letter}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
