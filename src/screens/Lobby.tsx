import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import BingoCardView from '../components/BingoCardView';
import Button from '../components/Button';
import { getCard } from '../lib/cards';
import { pickProgress, sortedPickEntries } from '../lib/cardSelection';
import { NAME_MAX, cleanName } from '../lib/names';
import { joinLink } from '../lib/roomCode';
import { updateMyPlayer } from '../lib/rooms';
import { saveLastName } from '../lib/session';
import type { Room } from '../lib/types';
import CardPicker from './CardPicker';

interface Props {
  code: string;
  room: Room;
  uid: string;
  onLeave: () => void;
}

export default function Lobby({ code, room, uid, onLeave }: Props) {
  const isHost = room.meta.hostId === uid;
  const players = Object.entries(room.players ?? {}).sort(([, a], [, b]) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
  const me = room.players?.[uid];
  const [picking, setPicking] = useState(false);
  const progressOf = (id: string) => pickProgress(room.picks?.[id], room.meta, room.claims, id);

  return (
    <main className="page mx-auto flex w-full max-w-md flex-col gap-4">
      <header className="flex items-center justify-between">
        <Button variant="ghost" className="-ml-3 px-3 text-[15px]" onClick={onLeave}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Home
        </Button>
        <span className="font-display text-sm font-bold tracking-[0.3em] text-faint">LOBBY</span>
        <span className="w-[76px]" />
      </header>

      <RoomCodeCard code={code} />

      {me && <NameEditor code={code} name={me.name} />}

      <MyCards room={room} uid={uid} onOpen={() => setPicking(true)} />

      <section className="rounded-[var(--radius-card)] bg-ink-900/80 p-2 ring-1 ring-white/[0.07]">
        <h2 className="flex items-baseline justify-between px-3 pt-2 pb-1">
          <span className="font-display text-lg font-bold">Players</span>
          <span className="text-sm text-muted">{players.length}</span>
        </h2>
        <ul>
          <AnimatePresence initial={false}>
            {players.map(([id, p]) => {
              const prog = progressOf(id);
              return (
                <motion.li
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2"
                >
                  <div className="relative">
                    <Avatar name={p.name} seed={id} size={44} />
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-[3px] ring-ink-900 ${p.online ? 'bg-mint' : 'bg-faint'}`}
                      title={p.online ? 'Online' : 'Away'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="flex items-center gap-2 text-xs text-muted">
                      {room.meta.hostId === id && (
                        <span className="inline-flex items-center gap-1 font-bold text-gold">
                          <svg viewBox="0 0 24 24" className="size-3.5 fill-gold" aria-hidden>
                            <path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-2 11H5L3 8z" />
                          </svg>
                          Host
                        </span>
                      )}
                      {id === uid && <span>You</span>}
                      {!p.online && <span>Away</span>}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                      prog.done ? 'bg-mint/15 text-mint' : 'bg-white/5 text-muted'
                    }`}
                  >
                    {prog.confirmed}/{prog.needed} confirmed
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </section>

      <div className="sticky bottom-0 mt-auto pt-2 pb-[max(env(safe-area-inset-bottom),0px)]">
        {isHost ? (
          <Button className="w-full" disabled>
            Start Game
          </Button>
        ) : (
          <p className="rounded-2xl bg-ink-900/80 py-4 text-center text-sm text-muted ring-1 ring-white/[0.07]">
            Waiting for the host to start…
          </p>
        )}
      </div>

      <AnimatePresence>
        {picking && <CardPicker code={code} uid={uid} room={room} onClose={() => setPicking(false)} />}
      </AnimatePresence>
    </main>
  );
}

function MyCards({ room, uid, onOpen }: { room: Room; uid: string; onOpen: () => void }) {
  const prog = pickProgress(room.picks?.[uid], room.meta, room.claims, uid);
  const held = sortedPickEntries(room.picks?.[uid]).filter(([, p]) => room.claims?.[p.cardId] === uid);
  const label = prog.done ? 'Edit cards' : held.length ? 'Continue' : 'Choose cards';
  return (
    <section className="rounded-[var(--radius-card)] bg-ink-900/80 p-4 ring-1 ring-white/[0.07]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Your cards</h2>
          <p className={`text-sm ${prog.done ? 'text-mint' : 'text-muted'}`}>
            {prog.done
              ? `All ${prog.needed} confirmed`
              : prog.extra > 0
                ? `Remove ${prog.extra} card${prog.extra === 1 ? '' : 's'}`
                : prog.pendingKeep > 0
                  ? `Keep or replace ${prog.pendingKeep} from last round`
                  : `${prog.confirmed} of ${prog.needed} confirmed`}
          </p>
        </div>
        <Button variant={prog.done ? 'secondary' : 'primary'} className="px-4 text-[15px]" onClick={onOpen}>
          {label}
        </Button>
      </div>
      {held.length > 0 && (
        <button onClick={onOpen} className="mt-3 flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Edit cards">
          {held.map(([slot, pick]) => (
            <div key={slot} className={`w-[84px] shrink-0 ${pick.round === room.meta.round ? '' : 'opacity-50'}`}>
              <BingoCardView card={getCard(pick.cardId)} />
            </div>
          ))}
        </button>
      )}
    </section>
  );
}

function RoomCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = joinLink(code);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join my Bingo room', text: `Join my Bingo room: ${code}`, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Share sheet dismissed.
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-violet/30 via-ink-800 to-coral/20 p-5 ring-1 ring-white/10">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Room code</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="font-display text-5xl font-black tracking-[0.18em] select-all">{code}</p>
        <Button variant="secondary" className="px-4 text-[15px]" onClick={share}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
          </svg>
          {copied ? 'Copied!' : 'Invite'}
        </Button>
      </div>
      <p className="mt-2 truncate text-xs text-faint">{link.replace(/^https?:\/\//, '')}</p>
    </section>
  );
}

function NameEditor({ code, name }: { code: string; name: string }) {
  const [draft, setDraft] = useState(name);
  const [prev, setPrev] = useState(name);
  if (name !== prev) {
    setPrev(name);
    setDraft(name);
  }

  const commit = () => {
    const clean = cleanName(draft);
    if (!clean) return setDraft(name);
    if (clean !== name) {
      saveLastName(clean);
      updateMyPlayer(code, { name: clean }).catch(() => setDraft(name));
    }
  };

  return (
    <label className="flex items-center gap-3 rounded-2xl bg-ink-900/80 px-4 py-2 ring-1 ring-white/[0.07]">
      <span className="text-xs font-semibold tracking-wider text-muted uppercase">Name</span>
      <input
        value={draft}
        maxLength={NAME_MAX}
        onChange={e => setDraft(e.target.value.slice(0, NAME_MAX))}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        enterKeyHint="done"
        className="h-11 min-w-0 flex-1 bg-transparent text-right text-[17px] font-semibold outline-none"
      />
    </label>
  );
}
