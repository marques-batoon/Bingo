export type RoomStatus = 'lobby' | 'playing' | 'over';
export type PlayMode = 'beginner' | 'pro';

/** rooms/{code}/meta: written only by the host. */
export interface RoomMeta {
  hostId: string;
  createdAt: number;
  status: RoomStatus;
  /** Goes up by one each time the host returns everyone to the lobby. */
  round: number;
  /** Default number of cards for each player. */
  cardsPerPlayer: number;
  /** Per-player overrides set by the host: playerId → card count. */
  cardCounts?: Record<string, number>;
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

/** rooms/{code}/bingos/{playerId} and blackouts/{playerId}: a player's claim, tagged with the call index. */
export interface WinClaim {
  cardId: number;
  /** Index of the latest call this player had seen when claiming. */
  i: number;
  at: number;
}

/** rooms/{code}/game/winners/{"<kind>_<playerId>"}: the host's verdict on a claim. */
export interface WinnerEntry {
  uid: string;
  kind: 'bingo' | 'blackout';
  cardId: number;
  i: number;
  ok: boolean;
  /** "<cardId>:<i>" of the claim this verdict is for, so a new claim gets checked again. */
  claimKey: string;
}

/** rooms/{code}/game: written only by the host. */
export interface GameState {
  round: number;
  startedAt: number;
  calls?: Record<string, Call>;
  /** 'blackout' once the host chooses Continue to Blackout. */
  mode?: 'bingo' | 'blackout';
  winners?: Record<string, WinnerEntry>;
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
  bingos?: Record<string, WinClaim>;
  blackouts?: Record<string, WinClaim>;
  /** claims/{cardId} = playerId */
  claims?: Record<string, string>;
}
