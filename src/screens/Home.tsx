import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BingoBalls from '../components/BingoBalls';
import Button from '../components/Button';
import { firebaseConfigured } from '../lib/firebase';
import { VENMO_URL } from '../lib/links';
import { NAME_MAX, cleanName, randomPlayerName } from '../lib/names';
import { CODE_LENGTH, isValidRoomCode, normalizeRoomCode } from '../lib/roomCode';
import { createRoom } from '../lib/rooms';
import { clearSession, loadLastName, loadSession, saveLastName } from '../lib/session';

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => loadLastName() || randomPlayerName());
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(loadSession);

  const playerName = cleanName(name);

  async function onCreate() {
    if (!playerName) return setError('Enter your name first.');
    setError(null);
    setBusy('create');
    saveLastName(playerName);
    try {
      const newCode = await createRoom(playerName);
      navigate(`/room/${newCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a room.');
      setBusy(null);
    }
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    if (!playerName) return setError('Enter your name first.');
    if (!isValidRoomCode(code)) return setError(`Room codes are ${CODE_LENGTH} letters or numbers.`);
    saveLastName(playerName);
    navigate(`/room/${code}`);
  }

  return (
    <main className="page mx-auto flex w-full max-w-md flex-col">
      <header className="flex flex-col items-center pt-6 pb-8 text-center">
        <BingoBalls size={50} />
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-6 font-display leading-none"
        >
          <span className="block text-sm font-bold tracking-[0.42em] text-gold">MARQUES</span>
          <span className="mt-1 block bg-gradient-to-b from-white to-[#cfc8ff] bg-clip-text text-[64px] font-black tracking-tight text-transparent">
            BINGO
          </span>
          <span className="mt-1 block text-sm font-bold tracking-[0.6em] text-muted">APP</span>
        </motion.h1>
        <p className="mt-4 text-[15px] text-muted">Real-time Bingo with friends, right on your phone.</p>
      </header>

      {!firebaseConfigured && (
        <div className="mb-4 rounded-2xl bg-coral/10 p-4 text-sm text-coral ring-1 ring-coral/30">
          Multiplayer isn't set up yet. Add your Firebase settings (see SETUP.md), then restart the app.
        </div>
      )}

      {saved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 flex items-center gap-3 rounded-2xl bg-ink-800/80 p-3 pl-4 ring-1 ring-mint/30"
        >
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-mint" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">You were in a room</p>
            <p className="font-display text-lg font-bold tracking-[0.2em]">{saved.code}</p>
          </div>
          <Button variant="ghost" className="px-3 text-sm" onClick={() => { clearSession(); setSaved(null); }}>
            Dismiss
          </Button>
          <Button className="px-4 text-[15px]" onClick={() => navigate(`/room/${saved.code}`)}>
            Rejoin
          </Button>
        </motion.div>
      )}

      <section className="rounded-[var(--radius-card)] bg-ink-900/80 p-5 shadow-[var(--shadow-lift)] ring-1 ring-white/[0.07] backdrop-blur">
        <label className="block">
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">Your name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value.slice(0, NAME_MAX))}
            maxLength={NAME_MAX}
            autoComplete="nickname"
            enterKeyHint="done"
            className="mt-2 h-12 w-full rounded-xl bg-ink-800 px-4 text-[17px] font-semibold text-fg ring-1 ring-white/10 outline-none placeholder:text-faint focus:ring-2 focus:ring-gold/70"
            placeholder="Your name"
          />
        </label>

        <Button className="mt-4 w-full" onClick={onCreate} disabled={!firebaseConfigured || busy !== null}>
          {busy === 'create' ? 'Creating room…' : 'Create Room'}
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold tracking-wider text-faint uppercase">
          <span className="h-px flex-1 bg-white/10" />
          or join a room
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={onJoin} className="flex gap-2">
          <input
            value={code}
            onChange={e => setCode(normalizeRoomCode(e.target.value))}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="Room code"
            placeholder="CODE"
            className="h-12 min-w-0 flex-1 rounded-xl bg-ink-800 text-center font-display text-2xl font-extrabold tracking-[0.45em] text-fg ring-1 ring-white/10 outline-none placeholder:text-faint/60 focus:ring-2 focus:ring-gold/70"
          />
          <Button type="submit" variant="secondary" disabled={!firebaseConfigured || code.length !== CODE_LENGTH}>
            Join
          </Button>
        </form>

        {error && <p className="mt-3 text-sm font-medium text-coral" role="alert">{error}</p>}
      </section>

      <footer className="mt-auto pt-10 text-center">
        <a
          href={VENMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted ring-1 ring-white/10 active:bg-white/5"
        >
          <svg viewBox="0 0 24 24" className="size-4 fill-coral" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.6 3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 19 5 21.1 8.6 19.6 11.9 17.5 16.4 12 21 12 21z" />
          </svg>
          Support the app
        </a>
      </footer>
    </main>
  );
}
