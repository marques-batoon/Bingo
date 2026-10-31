/**
 * Quick chat greetings. Add new ones at the END of the list: messages are sent as
 * their position in this list, so reordering or removing entries changes what
 * older app versions show. Keep each under 40 characters. Up to 100 entries.
 */
export const QUICK_CHAT = [
  "I'm close to Bingo!",
  'Only 1 more',
  "That's a bad number!",
  'You can do better than that!',
  'Salamat Po!',
  'No way!',
  'Someone stinks',
  'This app is so good!',
];

/** Seconds a player waits between messages (also enforced by the database rules). */
export const CHAT_COOLDOWN_MS = 3000;
