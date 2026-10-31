import {
  endAt,
  get,
  limitToFirst,
  orderByValue,
  query,
  ref,
  serverTimestamp,
  update,
} from 'firebase/database';
import { ensureAuth, getDb } from './firebase';
import { findAvatar } from './avatars';
import { DEFAULT_MARKER, MARKER_COLORS } from './markers';
import { randomRoomCode } from './roomCode';
import { loadPrefs, savePrefs } from './session';
import type { Player, Room, RoomMeta } from './types';

export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

function newPlayer(name: string): Omit<Player, 'joinedAt' | 'lastSeen'> & { joinedAt: object; lastSeen: object } {
  const prefs = loadPrefs();
  return {
    name,
    avatarId: findAvatar(prefs.avatarId) ? prefs.avatarId! : '',
    color: MARKER_COLORS.some(c => c.id === prefs.color) ? prefs.color! : DEFAULT_MARKER,
    mode: prefs.mode === 'pro' ? 'pro' : 'beginner',
    joinedAt: serverTimestamp(),
    online: true,
    lastSeen: serverTimestamp(),
  };
}

function isPermissionDenied(err: unknown) {
  return String((err as { code?: string })?.code ?? err).toLowerCase().includes('permission');
}

/** Creates a room with a fresh code and makes this device its host. Returns the code. */
export async function createRoom(name: string): Promise<string> {
  const uid = await ensureAuth();
  const db = getDb();
  // Tidy up old rooms in the background; never block or fail room creation on it.
  cleanupStaleRooms().catch(() => {});

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomRoomCode();
    const meta: Omit<RoomMeta, 'createdAt'> & { createdAt: object } = {
      hostId: uid,
      createdAt: serverTimestamp(),
      status: 'lobby',
      round: 1,
      cardsPerPlayer: 1,
    };
    try {
      // One atomic write. The rules refuse it if the code is already taken, so we retry.
      await update(ref(db), {
        [`roomIndex/${code}`]: serverTimestamp(),
        [`rooms/${code}/meta`]: meta,
        [`rooms/${code}/players/${uid}`]: newPlayer(name),
      });
      return code;
    } catch (err) {
      if (!isPermissionDenied(err)) throw err;
    }
  }
  throw new Error('Could not find a free room code. Please try again.');
}

export type JoinResult = 'joined' | 'rejoined' | 'not-found' | 'in-progress';

/** Joins a room, or rejoins it if this player is already in it (any game state). */
export async function joinRoom(code: string, name: string): Promise<JoinResult> {
  const uid = await ensureAuth();
  const db = getDb();
  const metaSnap = await get(ref(db, `rooms/${code}/meta`));
  if (!metaSnap.exists()) return 'not-found';
  const meta = metaSnap.val() as RoomMeta;

  const meRef = ref(db, `rooms/${code}/players/${uid}`);
  if ((await get(meRef)).exists()) {
    await update(meRef, { online: true, lastSeen: serverTimestamp() });
    return 'rejoined';
  }
  if (meta.status !== 'lobby') return 'in-progress';
  await update(ref(db), { [`rooms/${code}/players/${uid}`]: newPlayer(name) });
  return 'joined';
}

export async function updateMyPlayer(code: string, changes: Partial<Pick<Player, 'name' | 'avatarId' | 'color' | 'mode'>>) {
  const uid = await ensureAuth();
  const { name: _name, ...prefs } = changes;
  savePrefs(prefs);
  await update(ref(getDb(), `rooms/${code}/players/${uid}`), changes);
}

/** Deletes rooms older than 24 hours. Runs from any client; the rules allow deleting only stale rooms. */
export async function cleanupStaleRooms(limit = 25): Promise<number> {
  const db = getDb();
  const offset = (await get(ref(db, '.info/serverTimeOffset'))).val() ?? 0;
  const cutoff = Date.now() + offset - ROOM_TTL_MS;
  const snap = await get(query(ref(db, 'roomIndex'), orderByValue(), endAt(cutoff), limitToFirst(limit)));
  const codes = Object.keys(snap.val() ?? {});
  let removed = 0;
  for (const code of codes) {
    try {
      await update(ref(db), { [`rooms/${code}`]: null, [`roomIndex/${code}`]: null });
      removed++;
    } catch {
      // Someone else may have just cleaned it up, or clocks disagree slightly. Try next time.
    }
  }
  return removed;
}

/** Host: how many cards each player plays (1–8). Players with too many choose which to remove. */
export async function setCardsPerPlayer(code: string, count: number) {
  await update(ref(getDb(), `rooms/${code}/meta`), { cardsPerPlayer: Math.min(8, Math.max(1, count)) });
}

/** Host: removes a player from the lobby and releases their cards. */
export async function removePlayer(code: string, room: Room, playerId: string) {
  const changes: Record<string, null> = {
    [`rooms/${code}/players/${playerId}`]: null,
    [`rooms/${code}/picks/${playerId}`]: null,
  };
  for (const [cardId, owner] of Object.entries(room.claims ?? {})) {
    if (owner === playerId) changes[`rooms/${code}/claims/${cardId}`] = null;
  }
  await update(ref(getDb()), changes);
}

/** Host: starts the game. Card picks and claims lock (see database.rules.json). */
export async function startGame(code: string, round: number) {
  await update(ref(getDb()), {
    [`rooms/${code}/meta/status`]: 'playing',
    [`rooms/${code}/game`]: { round, startedAt: serverTimestamp() },
  });
}
