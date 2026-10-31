import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// A separate project ID so these tests never touch data from `npm run dev`.
const PROJECT = 'demo-bingo-rules';
const CODE = 'ABCD';
const HOST = 'host';
const ANA = 'ana';
const BEN = 'ben';
const DAY = 24 * 60 * 60 * 1000;

let env: RulesTestEnvironment;

const db = (uid: string) => env.authenticatedContext(uid).database();
const room = (path = '') => `rooms/${CODE}${path ? `/${path}` : ''}`;
const player = (name: string) => ({ name, avatarId: '', color: '#ff5d73', mode: 'beginner', joinedAt: 1, online: true, lastSeen: 1 });
const meta = (over: Record<string, unknown> = {}) => ({ hostId: HOST, createdAt: Date.now(), status: 'lobby', round: 1, cardsPerPlayer: 1, ...over });

/** Seeds a room (rules off): host + Ana + Ben, Ana holds card 42. */
async function seed(status = 'lobby', extra: Record<string, unknown> = {}) {
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.database().ref().update({
      [`roomIndex/${CODE}`]: Date.now(),
      [room('meta')]: meta({ status }),
      [room(`players/${HOST}`)]: player('Host'),
      [room(`players/${ANA}`)]: player('Ana'),
      [room(`players/${BEN}`)]: player('Ben'),
      [room('claims/42')]: ANA,
      [room(`picks/${ANA}/s0`)]: { cardId: 42, round: 1 },
      ...extra,
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    database: { host: '127.0.0.1', port: 9000, rules: readFileSync(process.env.RULES_FILE ?? 'database.rules.json', 'utf8') },
  });
});
afterAll(() => env?.cleanup());
beforeEach(() => env.clearDatabase());

describe('rooms', () => {
  it('lets a signed-in player create a room as its host', async () => {
    await assertSucceeds(
      db(HOST).ref().update({
        [`roomIndex/${CODE}`]: { '.sv': 'timestamp' },
        [room('meta')]: meta(),
        [room(`players/${HOST}`)]: player('Host'),
      }),
    );
  });

  it('refuses a room code that already exists', async () => {
    await seed();
    await assertFails(db(BEN).ref().update({ [`roomIndex/${CODE}`]: { '.sv': 'timestamp' }, [room('meta')]: meta({ hostId: BEN }) }));
  });

  it('refuses signed-out visitors', async () => {
    await seed();
    await assertFails(env.unauthenticatedContext().database().ref(room()).once('value'));
  });

  it('deletes only rooms older than 24 hours', async () => {
    await seed();
    await assertFails(db(BEN).ref().update({ [room()]: null, [`roomIndex/${CODE}`]: null }));
    await env.withSecurityRulesDisabled(async ctx => {
      await ctx.database().ref().update({ [`roomIndex/${CODE}`]: Date.now() - DAY - 1000, [room('meta/createdAt')]: Date.now() - DAY - 1000 });
    });
    await assertSucceeds(db(BEN).ref().update({ [room()]: null, [`roomIndex/${CODE}`]: null }));
  });
});

describe('players', () => {
  it('can write only their own node', async () => {
    await seed();
    await assertSucceeds(db(ANA).ref(room(`players/${ANA}`)).update({ color: '#22c55e' }));
    await assertFails(db(ANA).ref(room(`players/${BEN}`)).update({ color: '#22c55e' }));
  });

  it('validates names and unknown fields', async () => {
    await seed();
    await assertFails(db(ANA).ref(room(`players/${ANA}`)).update({ name: 'x'.repeat(17) }));
    await assertFails(db(ANA).ref(room(`players/${ANA}`)).update({ isHost: true }));
  });

  it('can join only while the room is in the lobby', async () => {
    await seed('playing');
    await assertFails(db('late').ref(room('players/late')).set(player('Late')));
  });

  it('locks name and avatar during a game, but not marker color or mode', async () => {
    await seed('playing');
    await assertFails(db(ANA).ref(room(`players/${ANA}/name`)).set('Anna'));
    await assertFails(db(ANA).ref(room(`players/${ANA}/avatarId`)).set('fruit/mango'));
    await assertSucceeds(db(ANA).ref(room(`players/${ANA}`)).update({ color: '#3b82f6', mode: 'pro' }));
  });

  it('lets the host remove a player', async () => {
    await seed();
    await assertSucceeds(db(HOST).ref(room(`players/${BEN}`)).remove());
    await assertFails(db(ANA).ref(room(`players/${HOST}`)).remove());
  });
});

describe('game state', () => {
  it('only the host writes meta and game', async () => {
    await seed();
    await assertFails(db(ANA).ref(room('meta/status')).set('playing'));
    await assertFails(db(ANA).ref(room('game')).set({ round: 1, startedAt: 1 }));
    await assertSucceeds(db(HOST).ref().update({ [room('meta/status')]: 'playing', [room('game')]: { round: 1, startedAt: 1 } }));
  });

  it('only the host sets per-player card counts (1–8)', async () => {
    await seed();
    await assertSucceeds(db(HOST).ref(room(`meta/cardCounts/${ANA}`)).set(3));
    await assertFails(db(ANA).ref(room(`meta/cardCounts/${ANA}`)).set(8));
    await assertFails(db(HOST).ref(room(`meta/cardCounts/${BEN}`)).set(9));
    await assertFails(db(HOST).ref(room(`meta/cardCounts/${BEN}`)).set(1.5));
    await assertSucceeds(db(HOST).ref(room(`meta/cardCounts/${ANA}`)).remove());
  });

  it('never rewrites a call', async () => {
    await seed('playing');
    const call = (n: number) => db(HOST).ref(room('game/calls/c0')).set({ n, i: 0, at: 1 });
    await assertSucceeds(call(7));
    await assertFails(call(9));
    await assertFails(db(HOST).ref(room('game/calls/c1')).set({ n: 76, i: 1, at: 1 }));
    await assertFails(db(HOST).ref(room('game/calls/c2')).set({ n: 5, i: 1, at: 1 }));
  });
});

describe('card claims (conflicts)', () => {
  it('lets a player claim a free card', async () => {
    await seed();
    await assertSucceeds(db(BEN).ref(room('claims/7')).set(BEN));
  });

  it('never lets a second player take a claimed card', async () => {
    await seed();
    await assertFails(db(BEN).ref(room('claims/42')).set(BEN));
    await assertFails(db(BEN).ref(room('claims/42')).remove());
  });

  it('resolves a race with transactions: exactly one winner', async () => {
    await seed();
    const take = (uid: string) =>
      db(uid).ref(room('claims/99')).transaction(cur => (cur === null ? uid : undefined));
    const [a, b] = await Promise.all([take(ANA), take(BEN)]);
    expect([a.committed, b.committed].filter(Boolean)).toHaveLength(1);
  });

  it('lets the owner release a claim', async () => {
    await seed();
    await assertSucceeds(db(ANA).ref().update({ [room('claims/42')]: null, [room(`picks/${ANA}/s0`)]: null }));
  });

  it('locks claims and picks once the game starts', async () => {
    await seed('playing');
    await assertFails(db(BEN).ref(room('claims/7')).set(BEN));
    await assertFails(db(ANA).ref(room('claims/42')).remove());
    await assertFails(db(ANA).ref(room(`picks/${ANA}/s0`)).remove());
  });

  it('accepts a pick only for a card the player holds', async () => {
    await seed();
    await assertFails(db(BEN).ref(room(`picks/${BEN}/s0`)).set({ cardId: 42, round: 1 }));
    await assertFails(db(ANA).ref(room(`picks/${ANA}/s1`)).set({ cardId: 42, round: 5 }));
  });
});

describe('marks and wins', () => {
  it('marks only on your own cards, only during a game, inside the square', async () => {
    await seed('playing');
    const m = (uid: string, card: number, pos = { x: 0, y: 0 }) => db(uid).ref(room(`marks/${uid}/${card}/c3`)).set(pos);
    await assertSucceeds(m(ANA, 42));
    await assertFails(m(BEN, 42));
    await assertFails(m(ANA, 42, { x: 0.5, y: 0 }));
    await assertFails(db(ANA).ref(room(`marks/${BEN}/42/c3`)).set({ x: 0, y: 0 }));
  });

  it('Bingo claims are for your own card only', async () => {
    await seed('playing');
    await assertSucceeds(db(ANA).ref(room(`bingos/${ANA}`)).set({ cardId: 42, i: 3, at: 1 }));
    await assertFails(db(BEN).ref(room(`bingos/${BEN}`)).set({ cardId: 42, i: 3, at: 1 }));
  });
});

describe('quick chat', () => {
  const send = (uid: string, id: string, m = 0, k: string = 'g') =>
    db(uid).ref().update({
      [`roomChat/${CODE}/msgs/${id}`]: { uid, k, m, at: { '.sv': 'timestamp' } },
      [`roomChat/${CODE}/last/${uid}`]: { '.sv': 'timestamp' },
    });

  it('lets room members send lobby and game greetings', async () => {
    await seed();
    await assertSucceeds(send(ANA, 'a1', 0, 'l'));
    await assertSucceeds(send(BEN, 'b1', 2, 'g'));
    await assertSucceeds(db(BEN).ref(`roomChat/${CODE}`).once('value'));
  });

  it('enforces a 3-second cooldown', async () => {
    await seed();
    await assertSucceeds(send(ANA, 'a1'));
    await assertFails(send(ANA, 'a2'));
  });

  it('refuses outsiders, spoofed senders and unknown messages', async () => {
    await seed();
    await assertFails(send('stranger', 's1'));
    await assertFails(db(ANA).ref().update({ [`roomChat/${CODE}/msgs/x`]: { uid: BEN, m: 0, at: { '.sv': 'timestamp' } }, [`roomChat/${CODE}/last/${ANA}`]: { '.sv': 'timestamp' } }));
    await assertFails(send(BEN, 'b1', 1.5));
    await assertFails(send(BEN, 'b2', 0, 'x'));
    await assertFails(db('stranger').ref(`roomChat/${CODE}`).once('value'));
  });
});
