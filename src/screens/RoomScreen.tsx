import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Game from './Game';
import Lobby from './Lobby';
import { ensureAuth, firebaseConfigured } from '../lib/firebase';
import { randomPlayerName } from '../lib/names';
import { startPresence } from '../lib/presence';
import { isValidRoomCode, normalizeRoomCode } from '../lib/roomCode';
import { joinRoom } from '../lib/rooms';
import { clearSession, loadLastName, saveSession } from '../lib/session';
import { useRoom } from '../lib/useRoom';

type Phase = 'connecting' | 'ready' | 'not-found' | 'in-progress' | 'error';

export default function RoomScreen() {
  const code = normalizeRoomCode(useParams().code ?? '');
  const valid = isValidRoomCode(code) && firebaseConfigured;
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('connecting');
  const [uid, setUid] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const room = useRoom(phase === 'ready' ? code : null);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    let stopPresence: (() => void) | undefined;
    (async () => {
      try {
        const id = await ensureAuth();
        const result = await joinRoom(code, loadLastName() || randomPlayerName());
        if (cancelled) return;
        if (result === 'not-found' || result === 'in-progress') {
          setPhase(result);
          return;
        }
        saveSession(code, id);
        setUid(id);
        stopPresence = startPresence(code, id);
        setPhase('ready');
      } catch (err) {
        if (cancelled) return;
        setErrorText(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
      stopPresence?.();
    };
  }, [code, valid]);

  if (!valid) return <Navigate to="/" replace />;

  const leave = () => {
    clearSession();
    navigate('/');
  };

  if (phase === 'not-found' || (phase === 'ready' && room === null)) {
    return (
      <Notice title="Room not found" onHome={leave}>
        Room <b className="tracking-widest text-fg">{code}</b> doesn't exist or has closed. Check the code and try again.
      </Notice>
    );
  }
  if (phase === 'in-progress') {
    return (
      <Notice title="Game in progress" onHome={leave}>
        This room's game has already started. You can join when they're back in the lobby.
      </Notice>
    );
  }
  if (phase === 'error') {
    return (
      <Notice title="Couldn't connect" onHome={leave}>
        {errorText || 'Check your connection and try again.'}
      </Notice>
    );
  }
  if (phase === 'connecting' || !room || !uid) {
    return (
      <main className="page grid place-items-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <div className="size-10 animate-spin rounded-full border-4 border-white/10 border-t-gold" />
          <p className="text-sm">Joining room {code}…</p>
        </div>
      </main>
    );
  }

  if (!room.players?.[uid]) {
    return room.meta.status === 'lobby' ? (
      <Notice title="You were removed" onHome={leave} action={{ label: 'Rejoin room', run: () => location.reload() }}>
        The host removed you from room <b className="tracking-widest text-fg">{code}</b>. You can rejoin while they're in the lobby.
      </Notice>
    ) : (
      <Notice title="Game in progress" onHome={leave}>
        You were removed from this game. You can rejoin when they're back in the lobby.
      </Notice>
    );
  }

  if (room.meta.status === 'lobby') return <Lobby code={code} room={room} uid={uid} onLeave={leave} />;

  if (room.meta.status === 'playing') return <Game code={code} room={room} uid={uid} />;

  return (
    <Notice title="Game over" onHome={leave}>
      The game over screen arrives in Phase 5.
    </Notice>
  );
}

interface NoticeProps {
  title: string;
  children: React.ReactNode;
  onHome: () => void;
  action?: { label: string; run: () => void };
}

function Notice({ title, children, onHome, action }: NoticeProps) {
  return (
    <main className="page mx-auto grid w-full max-w-md place-items-center">
      <div className="w-full rounded-[var(--radius-card)] bg-ink-900/80 p-6 text-center ring-1 ring-white/[0.07]">
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 text-[15px] text-muted">{children}</p>
        {action && <Button className="mt-6 w-full" onClick={action.run}>{action.label}</Button>}
        <Button variant={action ? 'secondary' : 'primary'} className={`${action ? 'mt-2' : 'mt-6'} w-full`} onClick={onHome}>
          Back to Home
        </Button>
      </div>
    </main>
  );
}
