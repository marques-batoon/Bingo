import { useEffect } from 'react';

/** Keeps the screen awake while mounted, where the browser supports it (iOS 16.4+). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release().catch(() => {});
      } catch {
        // Denied (e.g. Low Power Mode). The game still works.
      }
    };
    // The lock is dropped whenever the page is hidden; take it again on return.
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
