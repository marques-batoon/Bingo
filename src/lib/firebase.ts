import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
} from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase, type Database } from 'firebase/database';

const env = import.meta.env;
const useEmulator = env.VITE_USE_EMULATOR === 'true';

/** True when there is enough config to talk to Firebase (or the local emulators). */
export const firebaseConfigured = useEmulator || Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_DATABASE_URL);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

function init() {
  if (app) return;
  if (!firebaseConfigured) throw new Error('Firebase is not configured. See SETUP.md.');

  // Emulators run on the dev machine; use the page's host so phones on the same Wi-Fi reach them too.
  const host = typeof location !== 'undefined' ? location.hostname : 'localhost';
  app = initializeApp(
    useEmulator
      ? { apiKey: 'demo-key', projectId: 'demo-bingo', databaseURL: `http://${host}:9000?ns=demo-bingo-default-rtdb` }
      : {
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
          databaseURL: env.VITE_FIREBASE_DATABASE_URL,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.VITE_FIREBASE_APP_ID,
        },
  );
  auth = getAuth(app);
  db = getDatabase(app);
  if (useEmulator) {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectDatabaseEmulator(db, host, 9000);
  }
}

export function getDb(): Database {
  init();
  return db!;
}

let uidPromise: Promise<string> | null = null;

/**
 * Signs in anonymously once and resolves the stable player ID. Firebase keeps the
 * session in IndexedDB, so the same ID comes back after Safari reloads.
 */
export function ensureAuth(): Promise<string> {
  init();
  uidPromise ??= new Promise<string>((resolve, reject) => {
    const stop = onAuthStateChanged(auth!, user => {
      if (user) {
        stop();
        resolve(user.uid);
      }
    });
    // Wait for the persisted session to load before deciding to sign in.
    auth!.authStateReady().then(() => {
      if (!auth!.currentUser) signInAnonymously(auth!).catch(err => { stop(); reject(err); });
    });
  }).catch(err => {
    uidPromise = null;
    throw err;
  });
  return uidPromise;
}
