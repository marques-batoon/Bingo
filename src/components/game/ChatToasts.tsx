import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onValue, ref } from 'firebase/database';
import Avatar from '../Avatar';
import { QUICK_CHAT } from '../../config/quickChat';
import { listenQuickChat } from '../../lib/chat';
import { getDb } from '../../lib/firebase';
import type { Player } from '../../lib/types';

const VISIBLE = 3;
const SHOW_MS = 4000;

interface Toast {
  id: string;
  uid: string;
  text: string;
}

/**
 * Quick chat messages as a small stack in a lane above the bottom controls, so
 * they never cover the cards. Newest in front; up to 3 visible; each fades after ~4s.
 */
export default function ChatToasts({ code, players }: { code: string; players: Record<string, Player> | undefined }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const offset = useRef(0);
  const openedAt = useRef(Date.now());

  useEffect(() => onValue(ref(getDb(), '.info/serverTimeOffset'), s => (offset.current = s.val() ?? 0)), []);

  useEffect(
    () =>
      listenQuickChat(code, (id, msg) => {
        // Skip messages sent before this screen opened.
        if (msg.at < openedAt.current + offset.current - 1500) return;
        const text = QUICK_CHAT[msg.m];
        if (!text) return;
        setToasts(t => [...t.filter(x => x.id !== id), { id, uid: msg.uid, text }].slice(-VISIBLE));
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), SHOW_MS);
      }),
    [code],
  );

  return (
    <div className="pointer-events-none relative h-12 shrink-0" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t, i) => {
          const depth = toasts.length - 1 - i; // 0 = newest
          const p = players?.[t.uid];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: depth === 0 ? 1 : 0.85, y: -depth * 9, scale: 1 - depth * 0.05 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-x-0 bottom-1 mx-auto flex max-w-sm items-center gap-2 rounded-full bg-ink-700/95 py-1 pr-4 pl-1 shadow-[var(--shadow-lift)] ring-1 ring-white/10 backdrop-blur"
              style={{ zIndex: VISIBLE - depth }}
            >
              <Avatar name={p?.name ?? '?'} avatarId={p?.avatarId} seed={t.uid} size={32} />
              <p className="min-w-0 truncate text-sm">
                <b className="font-semibold">{p?.name ?? 'Someone'}</b>
                <span className="text-muted"> · </span>
                {t.text}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
