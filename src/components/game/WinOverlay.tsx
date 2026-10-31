import { motion } from 'framer-motion';
import type { WinKind } from '../../lib/bingo';

interface Props {
  kind: WinKind;
  busy: boolean;
  onClaim: () => void;
  onDismiss: () => void;
}

/** The big BINGO / BLACKOUT button, over everything, when this player's marks make a win. */
export default function WinOverlay({ kind, busy, onClaim, onDismiss }: Props) {
  const label = kind === 'bingo' ? 'BINGO!' : 'BLACKOUT!';
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <motion.button
          onClick={onClaim}
          disabled={busy}
          initial={{ scale: 0.3, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 14 }}
          whileTap={{ scale: 0.94 }}
          className="relative grid size-64 place-items-center rounded-full font-display text-ink-950 shadow-[0_20px_60px_-10px_rgb(255_138_61/0.8)]"
          style={{ background: 'radial-gradient(circle at 32% 28%, #ffe08a, #ffc94a 40%, #ff8a3d 80%)' }}
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-gold/30" aria-hidden />
          <span className="absolute inset-4 rounded-full border-4 border-white/50" aria-hidden />
          <span className={`relative font-black tracking-tight ${kind === 'bingo' ? 'text-6xl' : 'text-[38px]'}`}>
            {busy ? '…' : label}
          </span>
        </motion.button>
        <p className="max-w-xs text-[15px] text-fg">
          {kind === 'bingo' ? 'You have a Bingo! Tap to call it.' : 'Your whole card is marked! Tap to call it.'}
        </p>
        <button onClick={onDismiss} className="min-h-11 rounded-full px-5 text-sm font-semibold text-muted active:text-fg">
          Not yet
        </button>
      </div>
    </motion.div>
  );
}
