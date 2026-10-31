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

export interface Room {
  meta: RoomMeta;
  players?: Record<string, Player>;
  /** claims/{cardId} = playerId */
  claims?: Record<string, string>;
}
