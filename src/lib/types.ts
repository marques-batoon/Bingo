export type RoomStatus = 'lobby' | 'playing' | 'over';
export type PlayMode = 'beginner' | 'pro';

/** rooms/{code}/meta: written only by the host. */
export interface RoomMeta {
  hostId: string;
  createdAt: number;
  status: RoomStatus;
  /** Goes up by one each time the host returns everyone to the lobby. */
  round: number;
  cardsPerPlayer: number;
}

/** rooms/{code}/players/{playerId}: written only by that player. */
export interface Player {
  name: string;
  avatarId: string;
  color: string;
  mode: PlayMode;
  joinedAt: number;
  online: boolean;
  lastSeen: number;
}

/**
 * rooms/{code}/picks/{playerId}/{slotKey}: a card a player has confirmed.
 * Slot keys are "s0"…"s7" (letters keep RTDB from turning them into arrays).
 * A pick counts for this round only when `round` equals meta.round.
 */
export interface CardPick {
  cardId: number;
  round: number;
}

export type Picks = Record<string, CardPick>;

export interface Room {
  meta: RoomMeta;
  players?: Record<string, Player>;
  picks?: Record<string, Picks>;
  /** claims/{cardId} = playerId */
  claims?: Record<string, string>;
}
