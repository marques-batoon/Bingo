import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { getDb } from './firebase';
import type { Room } from './types';

/** Live room data. `undefined` while loading, `null` if the room was deleted. */
export function useRoom(code: string | null): Room | null | undefined {
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  useEffect(() => {
    if (!code) return;
    setRoom(undefined);
    return onValue(
      ref(getDb(), `rooms/${code}`),
      // A room without meta is a leftover from a deleted room: treat it as gone.
      snap => setRoom(snap.child('meta').exists() ? (snap.val() as Room) : null),
      () => setRoom(null),
    );
  }, [code]);
  return room;
}
