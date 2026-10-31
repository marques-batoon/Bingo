/**
 * Quick chat greetings: one list for the lobby, one for during the game.
 * Messages are sent as their position in the list, so add new ones at the END
 * (reordering changes what people on an older version of the page see).
 * Keep each short enough to fit on one line. Up to 100 per list.
 */
export type ChatPlace = 'lobby' | 'game';

export const QUICK_CHAT: Record<ChatPlace, string[]> = {
  lobby: [
    'Start the game!',
    'Wow this app is so good!',
    'I smell your kilikili',
    'Play the movie! Yeah!',
    'We should all donate to support this app!',
    'Winner winner chicken dinner',
    'All in baby',
    "I'm winning this one!",
    'Good luck everyone',
    "Let's Bin-Go",
  ],
  game: [
    'This app is so good!',
    "I'm close to Bingo!",
    'Just need 1 more',
    "That's a bad number!",
    'You can do better than that!',
    'Salamat Po!',
    'No way!',
    'Someone stinks',
  ],
};

/** Time a player waits between messages (also enforced by the database rules). */
export const CHAT_COOLDOWN_MS = 3000;
