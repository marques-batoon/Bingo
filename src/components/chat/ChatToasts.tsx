import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onValue, ref } from 'firebase/database';
import Avatar from '../Avatar';
import type { ChatPlace } from '../../config/quickChat';
import { chatText, listenQuickChat, placeOf } from '../../lib/chat';
import { getDb } from '../../lib/firebase';
import type { Player } from '../../lib/types';

const VISIBLE = 3;
const SHOW_MS = 4000;

interface Toast {
  id: string;
  uid: string;
  text: string;
}

interface Props {
  code: string;
  place: ChatPlace;
  players: Record<string, Player> | undefined;
  /** Extra classes for the container: where the stack sits on screen. */
  className?: string;
}

/**
 * Quick chat messages for this screen (lobby or game) as a small, semi-transparent
 * stack: avatar, name and message. Newest in front, up to 3, each fades after ~4s.
 * The container never takes taps, so it can't get in the way.
 */
export default function ChatToasts({ code, place, players, className = 'relative h-12 shrink-0' }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const offset = useRef(0);
  const openedAt = useRef(Date.now());

  useEffect(() => onValue(ref(getDb(), '.info/serverTimeOffset'), s => (offset.current = s.val() ?? 0)), []);

  useEffect(
    () =>
      listenQuickChat(code, (id, msg) => {
        // Skip messages sent before this screen opened, and ones meant for the other screen.
        if (msg.at < openedAt.current + offset.current - 1500 || placeOf(msg) !== place) return;
        const text = chatText(msg);
        if (!text) return;
        setToasts(t => [...t.filter(x => x.id !== id), { id, uid: msg.uid, text }].slice(-VISIBLE));
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), SHOW_MS);
      }),
    [code, place],
  );

  return (
    <div className={`pointer-events-none ${className}`} aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t, i) => {
          const depth = toasts.length - 1 - i; // 0 = newest
          const p = players?.[t.uid];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: depth === 0 ? 0.88 : 0.6, y: -depth * 9, scale: 1 - depth * 0.05 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-x-0 bottom-1 mx-auto flex max-w-sm items-center gap-2 rounded-full bg-ink-700/70 py-1 pr-4 pl-1 shadow-[var(--shadow-lift)] ring-1 ring-white/10 backdrop-blur-md"
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
