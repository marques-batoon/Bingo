import { AnimatePresence, motion } from 'framer-motion';
import { ballStyle } from '../../lib/balls';
import { letterFor } from '../../lib/cards';

/** The latest called number as a Bingo ball. Rolls in when it changes. */
export default function CurrentBall({ n, size = 64 }: { n: number | null; size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        {n === null ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid size-full place-items-center rounded-full border-2 border-dashed border-white/20 text-center text-[10px] font-semibold text-muted"
          >
            Ready
          </motion.div>
        ) : (
          <motion.div
            key={n}
            aria-label={`${letterFor(n)} ${n}`}
            initial={{ x: -size * 1.4, rotate: -270, opacity: 0, scale: 0.7 }}
            animate={{ x: 0, rotate: 0, opacity: 1, scale: 1 }}
            exit={{ x: size * 1.4, rotate: 200, opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="grid size-full place-items-center rounded-full"
            style={{
              background: `radial-gradient(circle at 32% 28%, ${ballStyle(n).from}, ${ballStyle(n).to} 72%)`,
              boxShadow: `0 10px 24px -8px ${ballStyle(n).to}, inset 0 -5px 10px rgb(0 0 0 / 0.22)`,
            }}
          >
            <div
              className="flex flex-col items-center justify-center rounded-full bg-white leading-none text-ink-950"
              style={{ width: size * 0.66, height: size * 0.66 }}
            >
              <span className="font-display font-black" style={{ fontSize: size * 0.15 }}>{letterFor(n)}</span>
              <span className="font-display font-black tabular-nums" style={{ fontSize: size * 0.3 }}>{n}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
