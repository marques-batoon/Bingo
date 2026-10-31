import { limitToLast, onChildAdded, push, query, ref, serverTimestamp, update } from 'firebase/database';
import { QUICK_CHAT, type ChatPlace } from '../config/quickChat';
import { getDb } from './firebase';

/** roomChat/{code}/msgs/{pushId}. Kept outside rooms/{code} so chat doesn't resend the whole room to everyone. */
export interface ChatMessage {
  uid: string;
  /** Which list: 'l' lobby, 'g' game (older messages have none and are game messages). */
  k?: 'l' | 'g';
  /** Index into that list. */
  m: number;
  at: number;
}

export const placeOf = (msg: ChatMessage): ChatPlace => (msg.k === 'l' ? 'lobby' : 'game');

export function chatText(msg: ChatMessage): string | undefined {
  return QUICK_CHAT[placeOf(msg)][msg.m];
}

/** Sends a greeting. The rules refuse it if this player sent one in the last 3 seconds. */
export async function sendQuickChat(code: string, uid: string, place: ChatPlace, index: number) {
  if (!QUICK_CHAT[place][index]) throw new Error('Unknown message');
  const db = getDb();
  const id = push(ref(db, `roomChat/${code}/msgs`)).key!;
  await update(ref(db), {
    [`roomChat/${code}/msgs/${id}`]: { uid, k: place === 'lobby' ? 'l' : 'g', m: index, at: serverTimestamp() },
    [`roomChat/${code}/last/${uid}`]: serverTimestamp(),
  });
}

/** Calls `onMessage` for each new message (only the latest few on connect). Returns unsubscribe. */
export function listenQuickChat(code: string, onMessage: (id: string, msg: ChatMessage) => void) {
  return onChildAdded(query(ref(getDb(), `roomChat/${code}/msgs`), limitToLast(5)), snap => {
    onMessage(snap.key!, snap.val() as ChatMessage);
  });
}
