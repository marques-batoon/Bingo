import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BingoCardView from '../components/BingoCardView';
import Button from '../components/Button';
import { CARD_COLORS, getCard, type CardColorId } from '../lib/cards';
import { browseOrder, cardsFor, freeSlotKey, nextCandidate, pickProgress, sortedPickEntries } from '../lib/cardSelection';
import { confirmCard, keepCard, releaseCard } from '../lib/claims';
import type { CardPick, Room } from '../lib/types';

interface Props {
  code: string;
  uid: string;
  room: Room;
  onClose: () => void;
}

type Selection = { kind: 'pick'; slot: string } | { kind: 'empty'; index: number };

export default function CardPicker({ code, uid, room, onClose }: Props) {
  const { meta, claims } = room;
  const myPicks = room.picks?.[uid];
  const progress = pickProgress(myPicks, meta, claims, uid);
  // Only picks this player still holds; a lost claim isn't shown as theirs.
  const held = sortedPickEntries(myPicks).filter(([, p]) => claims?.[p.cardId] === uid);
  const myCount = cardsFor(meta, uid);
  const emptyCount = Math.max(0, myCount - held.length);

  const order = useMemo(() => browseOrder(code, uid), [code, uid]);
  const [color, setColor] = useState<CardColorId | undefined>(undefined);
  const [pos, setPos] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(() => defaultSelection());

  function defaultSelection(): Selection {
    if (emptyCount > 0) return { kind: 'empty', index: 0 };
    const pending = held.find(([, p]) => p.round !== meta.round);
    return { kind: 'pick', slot: (pending ?? held[0])?.[0] ?? 's0' };
  }

  const isUnavailable = (id: number) => Boolean(claims?.[id]);
  const candidate = pos >= 0 ? order[pos] : null;

  // Start browsing once, and whenever the card being shown gets taken by someone else.
  const claimsRef = useRef(claims);
  claimsRef.current = claims;
  useEffect(() => {
    if (selection.kind !== 'empty') return;
    if (pos === -1 || (candidate !== null && claimsRef.current?.[candidate])) {
      // Our own claim lands here too, just before the slot fills; only warn about other players.
      if (pos !== -1 && candidate !== null && claimsRef.current?.[candidate] !== uid) setNotice('Someone just took that card');
      setPos(nextCandidate(order, pos, id => Boolean(claimsRef.current?.[id]), color));
    }
  }, [selection.kind, pos, candidate, claims, order, color, uid]);

  // If the selected pick disappears (released), fall back to a sensible slot.
  useEffect(() => {
    if (selection.kind === 'pick' && !held.some(([s]) => s === selection.slot)) setSelection(defaultSelection());
    if (selection.kind === 'empty' && selection.index >= emptyCount && emptyCount > 0) setSelection({ kind: 'empty', index: 0 });
    if (selection.kind === 'empty' && emptyCount === 0 && held.length) setSelection(defaultSelection());
  });

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(t);
  }, [notice]);

  function browse(next?: CardColorId) {
    setColor(next);
    setPos(p => nextCandidate(order, p, isUnavailable, next));
  }

  async function onConfirm() {
    if (candidate === null || busy) return;
    const slot = freeSlotKey(myPicks);
    if (!slot) return;
    setBusy(true);
    try {
      const result = await confirmCard(code, uid, slot, candidate, meta.round);
      if (result === 'taken') {
        setNotice('Sorry this card has been chosen');
        setPos(p => nextCandidate(order, p, id => id === candidate || isUnavailable(id), color));
      } else {
        setPos(p => nextCandidate(order, p, id => id === candidate || isUnavailable(id), color));
      }
    } catch {
      setNotice('Couldn’t confirm. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch {
      setNotice('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const selectedPick: CardPick | undefined =
    selection.kind === 'pick' ? held.find(([s]) => s === selection.slot)?.[1] : undefined;
  const shownCard = selection.kind === 'pick' ? (selectedPick ? getCard(selectedPick.cardId) : null) : candidate ? getCard(candidate) : null;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col bg-ink-950"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
    >
      <div className="page mx-auto flex h-dvh w-full max-w-md flex-col gap-3 short:max-w-3xl short:gap-2 !pb-[max(env(safe-area-inset-bottom),12px)]">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold">Choose your cards</h2>
            <p className="text-xs text-muted">
              {progress.confirmed}/{progress.needed} confirmed
              {progress.extra > 0 && <span className="text-coral"> · remove {progress.extra}</span>}
            </p>
          </div>
          <Button variant={progress.done ? 'primary' : 'secondary'} className="px-5 text-[15px]" onClick={onClose}>
            Done
          </Button>
        </header>

        {/* Slots */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {held.map(([slot, pick], i) => {
            const current = pick.round === meta.round;
            const active = selection.kind === 'pick' && selection.slot === slot;
            const c = getCard(pick.cardId).color;
            return (
              <button
                key={slot}
                onClick={() => setSelection({ kind: 'pick', slot })}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full pr-4 pl-1.5 text-sm font-semibold ring-1 transition ${
                  active ? 'bg-white/10 ring-gold' : 'bg-ink-800 ring-white/10'
                }`}
              >
                <span className="grid size-8 place-items-center rounded-full text-xs font-black" style={{ background: c.bg, color: c.text }}>
                  {current ? '✓' : '?'}
                </span>
                Card {i + 1}
              </button>
            );
          })}
          {Array.from({ length: emptyCount }, (_, i) => {
            const active = selection.kind === 'empty' && selection.index === i;
            return (
              <button
                key={`empty-${i}`}
                onClick={() => setSelection({ kind: 'empty', index: i })}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full pr-4 pl-1.5 text-sm font-semibold ring-1 transition ${
                  active ? 'bg-white/10 ring-gold' : 'bg-ink-800 text-muted ring-white/10'
                }`}
              >
                <span className="grid size-8 place-items-center rounded-full border-2 border-dashed border-white/25 text-xs">
                  {held.length + i + 1}
                </span>
                Card {held.length + i + 1}
              </button>
            );
          })}
        </div>

        {progress.extra > 0 && (
          <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral ring-1 ring-coral/30">
            The host changed you to {myCount} card{myCount === 1 ? '' : 's'}. Choose {progress.extra} to remove.
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 short:flex-row short:items-center short:gap-5">
        {/* Card preview */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {shownCard ? (
              <motion.div
                key={`${selection.kind}-${shownCard.id}`}
                initial={{ opacity: 0, x: 40, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -40, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="w-full max-w-[min(100%,calc((100dvh-330px)/1.18))] short:max-w-[calc((100dvh-150px)/1.18)]"
              >
                <BingoCardView card={shownCard} />
              </motion.div>
            ) : (
              <p className="text-center text-muted">
                {selection.kind === 'empty' ? 'No cards of that color are left.' : ''}
              </p>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {notice && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-ink-800/95 px-4 py-2 text-sm font-semibold whitespace-nowrap text-fg shadow-[var(--shadow-lift)] ring-1 ring-coral/50"
              >
                {notice}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 short:w-[320px] short:shrink-0">
        {selection.kind === 'empty' ? (
          <>
            <div className="flex items-center justify-between gap-1.5" role="radiogroup" aria-label="Card color">
              {CARD_COLORS.map(c => {
                const active = color === c.id;
                return (
                  <button
                    key={c.id}
                    role="radio"
                    aria-checked={active}
                    aria-label={c.name}
                    onClick={() => browse(c.id)}
                    className="grid size-11 place-items-center rounded-full transition active:scale-90"
                  >
                    <span
                      className={`block size-9 rounded-full ring-2 transition ${active ? 'scale-110 ring-white' : 'ring-white/25'}`}
                      style={{ background: c.bg }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button variant="secondary" onClick={() => browse(undefined)} disabled={busy}>
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
                Randomize
              </Button>
              <Button onClick={onConfirm} disabled={busy || candidate === null}>
                {busy ? 'Confirming…' : 'Confirm Card'}
              </Button>
            </div>
          </>
        ) : selectedPick ? (
          <PickActions
            pick={selectedPick}
            round={meta.round}
            mustRemove={progress.extra > 0}
            busy={busy}
            onKeep={() => run(() => keepCard(code, uid, selection.slot, meta.round))}
            onRelease={() => run(() => releaseCard(code, uid, selection.slot, selectedPick.cardId))}
          />
        ) : null}
        </div>
        </div>
      </div>
    </motion.div>
  );
}

function PickActions(props: {
  pick: CardPick;
  round: number;
  mustRemove: boolean;
  busy: boolean;
  onKeep: () => void;
  onRelease: () => void;
}) {
  const { pick, round, mustRemove, busy, onKeep, onRelease } = props;
  if (mustRemove) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {pick.round !== round ? (
          <Button variant="secondary" onClick={onKeep} disabled={busy}>Keep</Button>
        ) : (
          <span className="grid place-items-center text-sm font-semibold text-mint">✓ Confirmed</span>
        )}
        <Button onClick={onRelease} disabled={busy}>Remove card</Button>
      </div>
    );
  }
  if (pick.round !== round) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onRelease} disabled={busy}>Replace</Button>
        <Button onClick={onKeep} disabled={busy}>Keep this card</Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      <p className="flex items-center gap-2 font-semibold text-mint">
        <span className="grid size-6 place-items-center rounded-full bg-mint/20 text-sm">✓</span>
        Confirmed
      </p>
      <Button variant="secondary" onClick={onRelease} disabled={busy}>Change this card</Button>
    </div>
  );
}
