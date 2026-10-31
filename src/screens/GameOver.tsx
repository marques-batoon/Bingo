import { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import BingoBalls from '../components/BingoBalls';
import BingoCardView from '../components/BingoCardView';
import Button from '../components/Button';
import Marker from '../components/Marker';
import { getCard } from '../lib/cards';
import { calledNumbers, cellKey, returnToLobby } from '../lib/game';
import { VENMO_URL } from '../lib/links';
import type { Room, WinnerEntry } from '../lib/types';

interface Props {
  code: string;
  room: Room;
  uid: string;
  onLeave: () => void;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

export default function GameOver({ code, room, uid, onLeave }: Props) {
  const isHost = room.meta.hostId === uid;
  const [returning, setReturning] = useState(false);
  const winners = Object.values(room.game?.winners ?? {})
    .filter(w => w.ok)
    // Blackout first, then Bingo, each in the order they won.
    .sort((a, b) => (a.kind === b.kind ? a.i - b.i : a.kind === 'blackout' ? -1 : 1));
  const callCount = calledNumbers(room.game).length;

  async function onReturn() {
    setReturning(true);
    try {
      await returnToLobby(code, room);
    } catch {
      setReturning(false);
    }
  }

  return (
    <main className="page mx-auto flex w-full max-w-md flex-col gap-5">
      <motion.header {...fadeUp(0)} className="flex flex-col items-center pt-4 text-center">
        <BingoBalls size={40} />
        <h1 className="mt-4 font-display text-4xl font-black">Game over</h1>
        <p className="mt-1 text-sm text-muted">
          {callCount} number{callCount === 1 ? '' : 's'} called · Round {room.meta.round}
        </p>
      </motion.header>

      <motion.section {...fadeUp(0.15)} className="rounded-[var(--radius-card)] bg-ink-900/80 p-4 ring-1 ring-white/[0.07]">
        <h2 className="mb-3 font-display text-lg font-bold">{winners.length === 1 ? 'Winner' : 'Winners'}</h2>
        {winners.length === 0 ? (
          <p className="py-4 text-center text-muted">No winner this time. Better luck next round!</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {winners.map((w, i) => (
              <WinnerRow key={`${w.kind}_${w.uid}`} room={room} winner={w} delay={0.25 + i * 0.1} />
            ))}
          </ul>
        )}
      </motion.section>

      <motion.section
        {...fadeUp(0.45)}
        className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-sky/25 via-ink-800 to-violet/25 p-5 ring-1 ring-white/10"
      >
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl" aria-hidden>
            ❤️
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Enjoying Marques Bingo?</h2>
            <p className="mt-1 text-sm text-muted">
              It's free with no ads. If you had fun, consider a small tip to help keep it running.
            </p>
          </div>
        </div>
        <a
          href={VENMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#008cff] font-display text-[17px] font-bold text-white shadow-[0_8px_24px_-10px_#008cff] active:brightness-95"
        >
          Support on Venmo
        </a>
      </motion.section>

      <motion.div {...fadeUp(0.6)} className="mt-auto flex flex-col gap-2 pb-2">
        {isHost ? (
          <Button onClick={onReturn} disabled={returning}>
            {returning ? 'Returning…' : 'Return to Lobby'}
          </Button>
        ) : (
          <p className="rounded-2xl bg-ink-900/80 py-4 text-center text-sm text-muted ring-1 ring-white/[0.07]">
            Waiting for the host to return to the lobby…
          </p>
        )}
        <Button variant="ghost" onClick={onLeave}>
          Leave room
        </Button>
      </motion.div>
    </main>
  );
}

function WinnerRow({ room, winner, delay }: { room: Room; winner: WinnerEntry; delay: number }) {
  const p = room.players?.[winner.uid];
  const marks = room.marks?.[winner.uid]?.[winner.cardId];
  return (
    <motion.li {...fadeUp(delay)} className="flex items-center gap-3">
      <Avatar name={p?.name ?? '?'} avatarId={p?.avatarId} seed={winner.uid} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{p?.name ?? 'Someone'}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 font-display text-xs font-black tracking-wide ${
            winner.kind === 'bingo' ? 'bg-gold text-ink-950' : 'bg-gradient-to-r from-violet to-coral text-white'
          }`}
        >
          {winner.kind === 'bingo' ? 'BINGO' : 'BLACKOUT'}
        </span>
      </div>
      <div className="w-[92px] shrink-0">
        <BingoCardView
          card={getCard(winner.cardId)}
          renderCellOverlay={(_n, row, col) =>
            marks?.[cellKey(row * 5 + col)] ? <Marker color={p?.color ?? '#ff5d73'} className="absolute inset-[14%]" /> : null
          }
        />
      </div>
    </motion.li>
  );
}
