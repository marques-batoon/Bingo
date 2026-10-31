import { useEffect, useRef, useState } from 'react';

export const REVEAL_DELAY_MS = 1000;

/**
 * How many calls this player has "seen". The host sees each call at once. Everyone
 * else sees a new call exactly 1 second after receiving it; until then it doesn't
 * count for them (no glow, no marking). Calls already made when the screen opens
 * (joining late, reconnecting) are shown immediately.
 */
export function useRevealedCount(callCount: number, isHost: boolean): number {
  const [revealed, setRevealed] = useState(callCount);
  const scheduled = useRef(callCount);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (isHost || callCount < scheduled.current) {
      // Host, or the game was reset: no delay.
      scheduled.current = callCount;
      setRevealed(callCount);
      return;
    }
    while (scheduled.current < callCount) {
      const reveal = ++scheduled.current;
      timers.current.push(window.setTimeout(() => setRevealed(r => Math.max(r, reveal)), REVEAL_DELAY_MS));
    }
  }, [callCount, isHost]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return Math.min(revealed, callCount);
}
