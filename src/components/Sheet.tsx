import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Bottom sheet over a dimmed backdrop. Wrap in <AnimatePresence> to animate out. */
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.button
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-label={title}
        className="relative flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem] bg-ink-900 pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/10"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 40 }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h2 className="font-display text-xl font-extrabold">{title}</h2>
          <button onClick={onClose} className="-mr-2 grid size-11 place-items-center rounded-full text-muted active:bg-white/5" aria-label="Close">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
