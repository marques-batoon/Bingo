import { ref, runTransaction, update } from 'firebase/database';
import { getDb } from './firebase';

export type ClaimResult = 'claimed' | 'taken';

/**
 * Claims a card for this player with an RTDB transaction, so two players can
 * never both hold it. Then records it in the player's picks. If recording the
 * pick fails, the claim is released again.
 */
export async function confirmCard(code: string, uid: string, slot: string, cardId: number, round: number): Promise<ClaimResult> {
  const db = getDb();
  const claimRef = ref(db, `rooms/${code}/claims/${cardId}`);
  const tx = await runTransaction(
    claimRef,
    current => (current === null || current === uid ? uid : undefined),
    { applyLocally: false },
  );
  if (!tx.committed || tx.snapshot.val() !== uid) return 'taken';

  try {
    await update(ref(db, `rooms/${code}/picks/${uid}/${slot}`), { cardId, round });
  } catch (err) {
    await update(ref(db), { [`rooms/${code}/claims/${cardId}`]: null }).catch(() => {});
    throw err;
  }
  return 'claimed';
}

/** Un-confirms a card: removes the pick and releases the claim in one write. */
export async function releaseCard(code: string, uid: string, slot: string, cardId: number) {
  await update(ref(getDb()), {
    [`rooms/${code}/picks/${uid}/${slot}`]: null,
    [`rooms/${code}/claims/${cardId}`]: null,
  });
}

/** Keeps a card from an earlier round for this round. */
export async function keepCard(code: string, uid: string, slot: string, round: number) {
  await update(ref(getDb(), `rooms/${code}/picks/${uid}/${slot}`), { round });
}
