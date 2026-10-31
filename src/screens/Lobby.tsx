import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import BingoCardView from '../components/BingoCardView';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import Sheet from '../components/Sheet';
import AvatarPicker from '../components/settings/AvatarPicker';
import MarkerPalette from '../components/settings/MarkerPalette';
import ModeToggle from '../components/settings/ModeToggle';
import { getCard } from '../lib/cards';
import { MAX_SLOTS, cardsFor, pickProgress, sortedPickEntries } from '../lib/cardSelection';
import { NAME_MAX, cleanName } from '../lib/names';
import { joinLink } from '../lib/roomCode';
import { clearPlayerCardCount, removePlayer, setCardsPerPlayer, setPlayerCardCount, startGame, updateMyPlayer } from '../lib/rooms';
import { saveLastName } from '../lib/session';
import type { Player, Room } from '../lib/types';
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
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const progressOf = (id: string) => pickProgress(room.picks?.[id], room.meta, room.claims, id);
  const notReady = players.filter(([id]) => !progressOf(id).done).map(([, p]) => p.name);

  async function onStart() {
    setStarting(true);
    try {
      await startGame(code, room.meta.round);
    } catch {
      setStarting(false);
    }
  }

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

      {me && <ProfileCard code={code} uid={uid} me={me} />}

      <MyCards room={room} uid={uid} onOpen={() => setPicking(true)} />

      {isHost && (
        <HostSettings code={code} count={room.meta.cardsPerPlayer} mixed={Object.keys(room.meta.cardCounts ?? {}).length > 0} />
      )}

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
                  <div className={`relative ${p.online ? '' : 'opacity-60'}`}>
                    <Avatar name={p.name} avatarId={p.avatarId} seed={id} size={44} />
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
                      {p.mode === 'pro' && <span className="font-semibold text-violet">Pro</span>}
                    </p>
                  </div>
                  {(() => {
                    const pillColor = prog.done ? 'bg-mint/15 text-mint' : prog.extra > 0 ? 'bg-coral/10 text-coral' : 'bg-white/5 text-muted';
                    const label = prog.extra > 0 ? `${prog.extra} extra` : `${prog.confirmed}/${prog.needed} confirmed`;
                    // Host: tap a player's cards to change how many they play (or remove them if away).
                    return isHost ? (
                      <button
                        onClick={() => setEditing(id)}
                        aria-label={`${p.name}: ${label}. Change cards`}
                        className={`flex min-h-11 items-center gap-1 rounded-full pr-2 pl-3 text-xs font-bold tabular-nums ring-1 ring-white/10 active:brightness-125 ${pillColor}`}
                      >
                        {label}
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${pillColor}`}>{label}</span>
                    );
                  })()}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </section>

      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-ink-950 via-ink-950/90 to-transparent pt-4 pb-[max(env(safe-area-inset-bottom),0px)]">
        {isHost ? (
          <>
            <Button className="w-full" disabled={notReady.length > 0 || starting} onClick={onStart}>
              {starting ? 'Starting…' : 'Start Game'}
            </Button>
            <p className="mt-2 min-h-4 truncate text-center text-xs text-muted">
              {notReady.length > 0 ? `Waiting on cards: ${notReady.join(', ')}` : 'Everyone is ready!'}
            </p>
          </>
        ) : (
          <p className="rounded-2xl bg-ink-900/80 py-4 text-center text-sm text-muted ring-1 ring-white/[0.07]">
            Waiting for the host to start…
          </p>
        )}
      </div>

      <AnimatePresence>
        {picking && <CardPicker code={code} uid={uid} room={room} onClose={() => setPicking(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {editing && room.players?.[editing] && (
          <PlayerCardsSheet
            code={code}
            room={room}
            playerId={editing}
            isSelf={editing === uid}
            onRemove={() => {
              setRemoving({ id: editing, name: room.players![editing].name });
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {removing && (
          <ConfirmDialog
            title={`Remove ${removing.name}?`}
            message="Their cards are released. They can rejoin with the room link while you're in the lobby."
            confirmLabel="Remove"
            onCancel={() => setRemoving(null)}
            onConfirm={() => {
              removePlayer(code, room, removing.id).catch(() => {});
              setRemoving(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function ProfileCard({ code, uid, me }: { code: string; uid: string; me: Player }) {
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  const save = (changes: Parameters<typeof updateMyPlayer>[1]) => updateMyPlayer(code, changes).catch(() => {});

  return (
    <section className="rounded-[var(--radius-card)] bg-ink-900/80 p-4 ring-1 ring-white/[0.07]">
      <div className="flex items-center gap-3">
        <button onClick={() => setChoosingAvatar(true)} className="relative shrink-0 rounded-full" aria-label="Change avatar">
          <Avatar name={me.name} avatarId={me.avatarId} seed={uid} size={60} />
          <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-fg text-ink-950 ring-[3px] ring-ink-900">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" aria-hidden>
              <path d="M4 20h4L19 9l-4-4L4 16v4z" />
            </svg>
          </span>
        </button>
        <NameEditor code={code} name={me.name} />
      </div>

      <h3 className="mt-5 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Marker color</h3>
      <MarkerPalette value={me.color} onChange={color => save({ color })} />

      <h3 className="mt-5 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Mode</h3>
      <ModeToggle value={me.mode} onChange={mode => save({ mode })} />

      <AnimatePresence>
        {choosingAvatar && (
          <AvatarPicker
            name={me.name}
            seed={uid}
            value={me.avatarId}
            onChange={avatarId => save({ avatarId })}
            onClose={() => setChoosingAvatar(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function PlayerCardsSheet(props: {
  code: string;
  room: Room;
  playerId: string;
  isSelf: boolean;
  onRemove: () => void;
  onClose: () => void;
}) {
  const { code, room, playerId, isSelf, onRemove, onClose } = props;
  const p = room.players![playerId];
  const count = cardsFor(room.meta, playerId);
  const custom = room.meta.cardCounts?.[playerId] !== undefined;
  const set = (n: number) => setPlayerCardCount(code, playerId, n).catch(() => {});
  return (
    <Sheet title={isSelf ? 'Your cards' : `${p.name}'s cards`} onClose={onClose}>
      <div className="px-5 pb-2">
        <div className="flex items-center gap-3">
          <Avatar name={p.name} avatarId={p.avatarId} seed={playerId} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.name}</p>
            <p className="text-xs text-muted">
              {custom ? 'Custom for this player' : `Room default (${room.meta.cardsPerPlayer})`}
            </p>
          </div>
          <Stepper value={count} onChange={set} label="cards" />
        </div>
        <p className="mt-3 text-xs text-muted">
          If you lower it, {isSelf ? 'you choose' : 'they choose'} which cards to give back.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {custom && (
            <Button variant="secondary" onClick={() => clearPlayerCardCount(code, playerId).catch(() => {})}>
              Use room default ({room.meta.cardsPerPlayer})
            </Button>
          )}
          {!isSelf && !p.online && (
            <button onClick={onRemove} className="min-h-12 rounded-2xl font-display text-[15px] font-bold text-coral active:bg-coral/10">
              Remove {p.name} from the room
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/** −/+ control with 44pt buttons. */
function Stepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-ink-800 p-1 ring-1 ring-white/10">
      <button
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`Fewer ${label}`}
        className="grid size-11 place-items-center rounded-xl text-2xl font-bold active:bg-white/10 disabled:text-faint"
      >
        −
      </button>
      <span className="w-8 text-center font-display text-2xl font-black tabular-nums" aria-live="polite">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_SLOTS}
        aria-label={`More ${label}`}
        className="grid size-11 place-items-center rounded-xl text-2xl font-bold active:bg-white/10 disabled:text-faint"
      >
        +
      </button>
    </div>
  );
}

function HostSettings({ code, count, mixed }: { code: string; count: number; mixed: boolean }) {
  const set = (n: number) => setCardsPerPlayer(code, n).catch(() => {});
  return (
    <section className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-ink-900/80 p-4 ring-1 ring-gold/20">
      <div>
        <h2 className="font-display text-lg font-bold">Cards per player</h2>
        <p className="text-xs text-muted">
          {mixed ? 'Some players are set differently. Changing this resets everyone.' : 'Sets everyone. Tap a player below to change just theirs.'}
        </p>
      </div>
      <Stepper value={count} onChange={set} label="cards for everyone" />
    </section>
  );
}

function MyCards({ room, uid, onOpen }: { room: Room; uid: string; onOpen: () => void }) {
  const prog = pickProgress(room.picks?.[uid], room.meta, room.claims, uid);
  const held = sortedPickEntries(room.picks?.[uid]).filter(([, p]) => room.claims?.[p.cardId] === uid);
  const label = prog.done ? 'Edit cards' : prog.extra > 0 ? 'Remove extra' : held.length ? 'Continue' : 'Choose cards';
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
    <label className="min-w-0 flex-1">
      <span className="text-xs font-semibold tracking-wider text-muted uppercase">Name</span>
      <input
        value={draft}
        maxLength={NAME_MAX}
        onChange={e => setDraft(e.target.value.slice(0, NAME_MAX))}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        enterKeyHint="done"
        className="mt-1 h-11 w-full rounded-xl bg-ink-800 px-3 text-[17px] font-semibold ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-gold/70"
      />
    </label>
  );
}
