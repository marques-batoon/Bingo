import { useCallback, useState } from 'react';

/** This device's in-game display settings. Not shared with other players. */
export interface GamePrefs {
  showBall: boolean;
  /** 0 = all cards on one page; otherwise cards per page. */
  perPage: number;
}

const KEY = 'marquesBingo.gamePrefs';
const DEFAULTS: GamePrefs = { showBall: true, perPage: 0 };

function load(): GamePrefs {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<GamePrefs>) };
  } catch {
    return DEFAULTS;
  }
}

export function useGamePrefs(): [GamePrefs, (changes: Partial<GamePrefs>) => void] {
  const [prefs, setPrefs] = useState(load);
  const update = useCallback((changes: Partial<GamePrefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...changes };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Ignore.
      }
      return next;
    });
  }, []);
  return [prefs, update];
}
