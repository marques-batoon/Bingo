import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../components/Button';
import CardPager from '../components/game/CardPager';
import CurrentBall from '../components/game/CurrentBall';
import GameCard from '../components/game/GameCard';
import GameSettingsSheet from '../components/game/GameSettingsSheet';
import HistorySheet from '../components/game/HistorySheet';
import LayoutSheet from '../components/game/LayoutSheet';
import { FREE, cellAt, getCard } from '../lib/cards';
import { sortedPickEntries } from '../lib/cardSelection';
import { BALL_COUNT } from '../lib/draw';
import { callNextNumber, calledNumbers, cellKey, setMark } from '../lib/game';
import { useGamePrefs } from '../lib/gamePrefs';
import { updateMyPlayer } from '../lib/rooms';
import type { Room } from '../lib/types';
import { useRevealedCount } from '../lib/useRevealedCount';
import { useWakeLock } from '../lib/useWakeLock';

interface Props {
  code: string;
  room: Room;
  uid: string;
}

type Panel = 'history' | 'layout' | 'settings' | null;

export default function Game({ code, room, uid }: Props) {
  const isHost = room.meta.hostId === uid;
  const me = room.players![uid];
  const hostOnline = room.players?.[room.meta.hostId]?.online ?? false;
  const [prefs, setPrefs] = useGamePrefs();
  const [panel, setPanel] = useState<Panel>(null);
  const [calling, setCalling] = useState(false);
  useWakeLock(true);

  const called = calledNumbers(room.game);
  const revealedCount = useRevealedCount(called.length, isHost);
  const revealedKey = called.slice(0, revealedCount).join(',');
  const revealed = useMemo(() => new Set(revealedKey ? revealedKey.split(',').map(Number) : []), [revealedKey]);
  const current = revealedCount > 0 ? called[revealedCount - 1] : null;

  const myCardIds = sortedPickEntries(room.picks?.[uid])
    .filter(([, p]) => room.claims?.[p.cardId] === uid)
    .map(([, p]) => p.cardId);
  const myMarks = room.marks?.[uid];
  const beginner = me.mode === 'beginner';

  const hasGlow = (cardId: number) => {
    const card = getCard(cardId);
    for (let cell = 0; cell < 25; cell++) {
      const n = cellAt(card, Math.floor(cell / 5), cell % 5);
      if (n !== FREE && revealed.has(n) && !myMarks?.[cardId]?.[cellKey(cell)]) return true;
    }
    return false;
  };

  async function onCall() {
    if (calling) return;
    setCalling(true);
    try {
      await callNextNumber(code, room.game);
    } catch {
      // A rule refusal (e.g. double tap) just means try again.
    } finally {
      setCalling(false);
    }
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col overflow-hidden pt-[max(env(safe-area-inset-top),8px)] pr-[max(env(safe-area-inset-right),12px)] pb-[max(env(safe-area-inset-bottom),8px)] pl-[max(env(safe-area-inset-left),12px)]">
      {/* Top bar */}
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 pb-2 short:pb-1">
        <button
          onClick={() => setPanel('history')}
          className="flex min-h-11 items-center gap-2 justify-self-start rounded-2xl bg-ink-800 px-3 ring-1 ring-white/10 active:bg-ink-700"
          aria-label="Called numbers"
        >
          <svg viewBox="0 0 24 24" className="size-5 text-muted" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span className="font-display text-[15px] font-bold tabular-nums">
            {revealedCount}
            <span className="text-faint">/{BALL_COUNT}</span>
          </span>
        </button>
        {prefs.showBall ? <CurrentBall n={current} size={64} /> : <span />}
        <span className="justify-self-end text-right text-xs leading-tight text-faint">
          Room
          <br />
          <b className="font-display text-sm tracking-widest text-muted">{code}</b>
        </span>
      </header>

      <AnimatePresence>
        {!isHost && !hostOnline && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-2 shrink-0 overflow-hidden rounded-xl bg-amber/15 px-3 py-2 text-center text-sm font-semibold text-amber ring-1 ring-amber/30"
          >
            Waiting for the host to come back…
          </motion.p>
        )}
      </AnimatePresence>

      {/* Cards */}
      <CardPager
        items={myCardIds}
        perPage={prefs.perPage}
        itemKey={id => id}
        pageHasAlert={ids => beginner && ids.some(hasGlow)}
        renderItem={cardId => (
          <GameCard
            card={getCard(cardId)}
            marks={myMarks?.[cardId]}
            color={me.color}
            revealed={revealed}
            beginner={beginner}
            onMark={cell => setMark(code, uid, cardId, cell, { x: 0, y: 0 }).catch(() => {})}
            onMove={(cell, pos) => setMark(code, uid, cardId, cell, pos).catch(() => {})}
          />
        )}
      />

      {/* Host controls */}
      {isHost && (
        <div className="shrink-0 pt-2">
          <Button className="w-full text-lg" onClick={onCall} disabled={calling || called.length >= BALL_COUNT}>
            {called.length >= BALL_COUNT ? 'All 75 numbers called' : calling ? 'Calling…' : 'Call Next Number'}
          </Button>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="mt-2 grid shrink-0 grid-cols-2 gap-2">
        <BarButton label="Layout" onClick={() => setPanel('layout')}>
          <path d="M4 5h7v14H4zM13 5h7v6h-7zM13 13h7v6h-7z" />
        </BarButton>
        <BarButton label="Settings" onClick={() => setPanel('settings')}>
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </BarButton>
      </nav>

      <AnimatePresence>
        {panel === 'history' && <HistorySheet called={called.slice(0, revealedCount)} onClose={() => setPanel(null)} />}
        {panel === 'layout' && (
          <LayoutSheet cardCount={myCardIds.length} perPage={prefs.perPage} onChange={perPage => setPrefs({ perPage })} onClose={() => setPanel(null)} />
        )}
        {panel === 'settings' && (
          <GameSettingsSheet
            color={me.color}
            mode={me.mode}
            showBall={prefs.showBall}
            onColor={color => updateMyPlayer(code, { color }).catch(() => {})}
            onMode={mode => updateMyPlayer(code, { mode }).catch(() => {})}
            onShowBall={showBall => setPrefs({ showBall })}
            onClose={() => setPanel(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function BarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink-800 text-sm font-semibold text-muted ring-1 ring-white/10 active:bg-ink-700 active:text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
      {label}
    </button>
  );
}
