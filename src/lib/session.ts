// The room this device was last in, so a reload or a Home Screen launch can rejoin it.
const KEY = 'marquesBingo.session';

export interface SavedSession {
  code: string;
  playerId: string;
  savedAt: number;
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedSession;
    // Rooms are cleaned up after 24 hours.
    if (!s.code || Date.now() - s.savedAt > 24 * 60 * 60 * 1000) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveSession(code: string, playerId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, playerId, savedAt: Date.now() } satisfies SavedSession));
  } catch {
    // Private mode or blocked storage: rejoining still works from the room link.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}

const NAME_KEY = 'marquesBingo.name';

/** The name this device used last, so players don't retype it every game. */
export function loadLastName(): string | null {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

export function saveLastName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Ignore.
  }
}
