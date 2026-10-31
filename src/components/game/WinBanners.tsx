import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../Avatar';
import type { Player, WinnerEntry } from '../../lib/types';

interface Banner {
  key: string;
  name: string;
  avatarId: string;
  uid: string;
  kind: WinnerEntry['kind'];
}

/** "[Name] got Bingo!" banners at the top for every newly verified win. */
export default function WinBanners({ winners, players }: { winners: Record<string, WinnerEntry> | undefined; players: Record<string, Player> | undefined }) {
  const seen = useRef<Set<string> | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const ok = Object.entries(winners ?? {}).filter(([, w]) => w.ok);
    // Wins verified before this screen opened aren't announced again.
    if (!seen.current) {
      seen.current = new Set(ok.map(([k, w]) => `${k}:${w.claimKey}`));
      return;
    }
    const fresh = ok.filter(([k, w]) => !seen.current!.has(`${k}:${w.claimKey}`));
    if (!fresh.length) return;
    for (const [k, w] of fresh) seen.current.add(`${k}:${w.claimKey}`);
    const added = fresh.map(([k, w]) => ({
      key: `${k}:${w.claimKey}`,
      uid: w.uid,
      kind: w.kind,
      name: players?.[w.uid]?.name ?? 'Someone',
      avatarId: players?.[w.uid]?.avatarId ?? '',
    }));
    setBanners(b => [...b, ...added]);
    navigator.vibrate?.([60, 40, 60]);
    for (const a of added) setTimeout(() => setBanners(b => b.filter(x => x.key !== a.key)), 6000);
  }, [winners, players]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),10px)]">
      <AnimatePresence>
        {banners.map(b => (
          <motion.div
            key={b.key}
            layout
            initial={{ y: -80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className={`flex w-full max-w-md items-center gap-3 rounded-2xl p-2.5 pr-4 font-display shadow-[var(--shadow-lift)] ${
              b.kind === 'bingo' ? 'bg-gradient-to-r from-gold to-amber text-ink-950' : 'bg-gradient-to-r from-violet to-coral text-white'
            }`}
            role="status"
          >
            <Avatar name={b.name} avatarId={b.avatarId} seed={b.uid} size={40} />
            <p className="line-clamp-2 min-w-0 flex-1 text-lg leading-tight font-extrabold">
              {b.name} got {b.kind === 'bingo' ? 'Bingo!' : 'BLACKOUT!'}
            </p>
            <span className="text-2xl" aria-hidden>{b.kind === 'bingo' ? '🎉' : '🏆'}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
