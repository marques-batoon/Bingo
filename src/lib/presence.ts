import { onDisconnect, onValue, ref, serverTimestamp, update } from 'firebase/database';
import { getDb } from './firebase';

/**
 * Keeps players/{uid}/online accurate. The player's node itself is never removed on
 * disconnect: their cards, marks and settings stay in the room while they're away.
 * Returns a cleanup function.
 */
export function startPresence(code: string, uid: string): () => void {
  const db = getDb();
  const meRef = ref(db, `rooms/${code}/players/${uid}`);
  let connected = false;

  const markOnline = () => update(meRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {});

  const stopConnected = onValue(ref(db, '.info/connected'), snap => {
    connected = snap.val() === true;
    if (!connected) return;
    // Register the "went away" write on the server first, then say we're here.
    onDisconnect(meRef)
      .update({ online: false, lastSeen: serverTimestamp() })
      .then(markOnline)
      .catch(() => {});
  });

  // iPhone Safari freezes background tabs; when the page comes back, re-announce right away.
  const onVisible = () => {
    if (document.visibilityState === 'visible' && connected) markOnline();
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    stopConnected();
    document.removeEventListener('visibilitychange', onVisible);
    onDisconnect(meRef).cancel().catch(() => {});
    update(meRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {});
  };
}
