# MARQUES BINGO APP: Setup

This guide takes you from nothing to a live Bingo app your friends can open on their phones. Everything here is free: Firebase's **Spark** plan and Netlify's free plan. No credit card needed.

You'll need:

- A Google account (for Firebase)
- A GitHub account (for Netlify deploys) with this project pushed to a repository
- Node.js 22 or newer on your computer

---

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Create a project**.
2. Name it (for example `marques-bingo`) and click **Continue**.
3. Google Analytics isn't needed. Turn it off and click **Create project**.
4. When it's ready, click **Continue**. You're on the project overview page.

## 2. Turn on Anonymous sign-in

Players never make accounts. The app signs each phone in anonymously so it gets a stable player ID.

1. In the left menu, open **Build → Authentication** and click **Get started**.
2. On the **Sign-in method** tab, click **Anonymous**, switch it **on**, and click **Save**.

## 3. Create the Realtime Database

1. In the left menu, open **Build → Realtime Database** and click **Create Database**.
2. Pick the location closest to your players (for example **United States**) and click **Next**.
3. Choose **Start in locked mode** and click **Enable**. (The next step replaces these rules.)
4. Copy the database URL shown at the top of the **Data** tab. It looks like `https://marques-bingo-default-rtdb.firebaseio.com`.

## 4. Publish the security rules

The rules make sure players can only change their own data, only the host runs the game, and two players can never hold the same card.

1. In **Realtime Database**, open the **Rules** tab.
2. Delete everything in the editor.
3. Open `database.rules.json` from this project, copy all of it, and paste it into the editor.
4. Click **Publish**.

Do this again whenever `database.rules.json` changes in a later update.

## 5. Register the web app and get your config

1. Go to **Project settings** (gear icon next to **Project Overview**).
2. Under **Your apps**, click the web icon **`</>`**.
3. Give it a nickname (for example `bingo-web`). Leave **Firebase Hosting** unchecked. Click **Register app**.
4. You'll see a `firebaseConfig` block. Keep this page open for the next step.

## 6. Set up environment variables on your computer

1. In the project folder, copy `.env.example` to a new file named `.env.local`.
2. Fill in each value from the `firebaseConfig` block:

   | `.env.local` | `firebaseConfig` |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_DATABASE_URL` | `databaseURL` (or the URL from step 3) |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

3. Set `VITE_USE_EMULATOR=false`.

These values aren't secret (every visitor's browser receives them). The security rules are what protect your data. `.env.local` is still kept out of git so each copy of the project can point at its own Firebase project.

## 7. Run it locally

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints (usually <http://localhost:5173>).

### Testing without Firebase (local emulators)

You can test everything offline with Firebase's emulators. They need Java installed.

1. In `.env.local`, set `VITE_USE_EMULATOR=true`.
2. In one Terminal window:

   ```bash
   npm run emulators
   ```

3. In a second Terminal window:

   ```bash
   npm run dev
   ```

The emulators load `database.rules.json` automatically. You can watch the data live at <http://localhost:4000/database>. Emulator data disappears when you stop them.

## 8. Test multiplayer on your own devices

Every browser profile counts as one player (the anonymous sign-in is stored per browser), so **two tabs in the same browser are the same player**. To get several players:

- **On one computer:** use different browsers (Safari, Chrome, Firefox), or a normal window plus a private/incognito window. Each one is a separate player.
- **On phones on the same Wi-Fi:**
  1. Start the dev server so other devices can reach it:

     ```bash
     npm run dev:lan
     ```

  2. It prints a **Network** address like `http://192.168.1.20:5173`. Open that on each phone.
  3. If you're using the emulators, phones reach them through the same address automatically. If macOS asks whether to allow incoming connections for Node or Java, click **Allow**.

Create a room on one device, then join with the code (or the `/join/CODE` link) on the others.

## 9. Deploy to Netlify

1. Push this project to a GitHub repository.
2. Go to <https://app.netlify.com>, sign in with GitHub, and click **Add new site → Import an existing project**.
3. Pick **GitHub** and choose the repository.
4. Netlify reads `netlify.toml`, so the build settings fill in for you (build command `npm run build`, publish directory `dist`). Don't change them.
5. Before deploying, click **Add environment variables** (or after the first deploy: **Site configuration → Environment variables**) and add each `VITE_FIREBASE_…` variable with the same values as your `.env.local`. Don't add `VITE_USE_EMULATOR` (or set it to `false`).
6. Click **Deploy**. When it finishes you get an address like `https://marques-bingo.netlify.app`.
7. If you added the environment variables after the first deploy, go to **Deploys → Trigger deploy → Deploy site** so the build picks them up.

### Allow your Netlify address in Firebase

1. In Firebase, open **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and enter your Netlify address without `https://` (for example `marques-bingo.netlify.app`). Add your custom domain too if you set one up.

## 10. Share a room with friends

1. Open your Netlify address and tap **Create Room**.
2. Tap **Invite** in the lobby. On iPhone this opens the share sheet so you can text the link. Elsewhere it copies the link.
3. Friends open the link (it looks like `https://marques-bingo.netlify.app/join/ABCD`), or open the site and type the 4-letter code.
4. Tip for iPhone: in Safari, tap **Share → Add to Home Screen** to get an app icon.

If someone's phone locks or Safari reloads, reopening the site brings them back to their room automatically.

---

## Free-plan limits (good to know)

- Firebase Spark: **100 simultaneous connections** across all rooms, 1 GB stored, 10 GB downloaded per month. A Bingo game uses very little, so this is plenty for friends and family games.
- Rooms older than 24 hours are deleted automatically whenever someone creates a new room.
