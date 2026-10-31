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

/** rooms/{code}/game/calls/{"c<index>"}: one called ball. */
export interface Call {
  n: number;
  /** 0-based call order. */
  i: number;
  at: number;
}

/** rooms/{code}/game: written only by the host. */
export interface GameState {
  round: number;
  startedAt: number;
  calls?: Record<string, Call>;
}

/** Marker offset inside its square, as a fraction of the square's size. */
export interface MarkPos {
  x: number;
  y: number;
}

/** rooms/{code}/marks/{playerId}/{cardId}/{"c<cell 0–24>"} */
export type CardMarks = Record<string, MarkPos>;

export interface Room {
  meta: RoomMeta;
  players?: Record<string, Player>;
  picks?: Record<string, Picks>;
  game?: GameState;
  marks?: Record<string, Record<string, CardMarks>>;
  /** claims/{cardId} = playerId */
  claims?: Record<string, string>;
}
