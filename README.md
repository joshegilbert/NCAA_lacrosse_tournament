# NCAA Division I Men’s Lacrosse Bracket Challenge

A private league bracket pool: create an account, start or join a league with an invite code, fill a bracket before the lock, then track points as you enter real results on the admin page. Built with **Vue 3 + Vite + Tailwind**, **Express + MongoDB + Mongoose**, and **JWT** auth (passwords hashed with **bcrypt**).

## Prerequisites

- Node.js 18+
- **MongoDB** running locally (e.g. `mongodb://127.0.0.1:27017/lacrosse_bracket`) or a cloud URI

## Install

**Backend**

```bash
cd server
npm install
cp .env.example .env
# Edit .env: MONGO_URI, JWT_SECRET, CLIENT_ORIGIN, PORT
```

**Frontend**

```bash
cd client
npm install
cp .env.example .env
# Set VITE_API_URL, e.g. http://localhost:3000/api
```

## Seed the tournament data

With MongoDB up and `MONGO_URI` set in `server/.env`:

```bash
cd server
npm run seed
```

This loads `server/data/teams-2026.json` and `server/data/bracket-2026.di.json` (18-team 2026-style tree: opening round, first round, quarterfinals, semifinals, championship). Scoring points are in `server/src/config/scoring.config.js`.

**Per-league tournament results:** Game winners are stored per league in `LeagueMatchupResult`. If you already had winners on the global `Matchup` documents before that change, copy them into every league once:

```bash
cd server
npm run migrate-league-results
```

**Team logos:** `teams-2026.json` references paths like `/logos/princeton.png`. The repo includes PNGs under `client/public/logos/` generated from ESPN’s public NCAA logo CDN. To refresh or regenerate after editing slug → ID mappings:

```bash
cd server
npm run download-logos -- --force
```

Mappings live in `server/data/team-logo-sources.json` (slug to numeric ESPN NCAA id used in `https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png`). Use the id from the school’s current ESPN page URL (often four digits); legacy short ids can still return **200** but the wrong school’s mark. If a file is missing, the UI falls back to initials.

**Trademark:** School names, logos, and NCAA marks are property of their respective owners. This project is an unofficial fan/pool tool and is not affiliated with the NCAA or any university.

## Run the app

**API** (from `server/`):

```bash
npm run dev
```

**Web app** (from `client/`, in another terminal):

```bash
npm run dev
```

Open the Vite URL (default `http://localhost:5173`). The API defaults to `http://localhost:3000`.

## Optional environment variables

| Variable         | Description                                      |
| ---------------- | ------------------------------------------------ |
| `BRACKET_LOCK_AT` | ISO time override for the default lock when creating leagues (see `server/src/config/app.config.js`) |

## Happy-path test

1. Register a user, then create a league from the dashboard.  
2. Copy the **invite code**, open a private window, register a second user, and **join** with that code.  
3. As user 1, open the league, **fill your bracket**, and **Save** (order matters: set opening games before first-round games that depend on them).  
4. As the **league creator**, open **Admin results**, set **actual winners** in order (opening → … → championship).  
5. Refresh the **leaderboard** on the league page.  
6. Open **Scoring summary and legend** (from the league page) or your bracket view to see per-game scoring status (correct / incorrect / pending / incomplete).

## Project layout

- `client/` — Vue 3 SPA (`src/views`, `src/stores`, `src/services/api.js`)  
- `server/` — Express API under `src/` (`models`, `routes`, `services/manualResultsService.js`, `services/lacrosseResultsService.js` stub)  
- `server/scripts/seed.js` — database seed  
- `server/scripts/download-team-logos.mjs` — download logos into `client/public/logos/`

## Production build (frontend)

```bash
cd client
npm run build
```

Serve the `client/dist` folder with any static host; set `VITE_API_URL` at build time to your API’s public URL.

## Deploy on Vercel (single project: Vue + Express API)

This repo is wired for **one Vercel deployment**: static files from `client/dist`, and `/api/*` handled by a serverless function (`api/index.js`) that runs the same Express app as `server/`.

### 1. MongoDB Atlas

1. Create a free cluster and a database user.
2. **Network Access** → allow **`0.0.0.0/0`** (Vercel functions use dynamic IPs).
3. Copy the **SRV connection string** and substitute the password → use as `MONGO_URI`.

### 2. Import the project on Vercel

1. [vercel.com/new](https://vercel.com/new) → import `NCAA_lacrosse_tournament` (or your fork).
2. Leave the **root directory** as the repository root (so `vercel.json` is picked up).
3. Vercel will use `installCommand` / `buildCommand` / `outputDirectory` from `vercel.json`.

### 3. Environment variables (Project → Settings → Environment Variables)

Set for **Production** (and **Preview** if you use preview deployments):

| Name | Example / notes |
| --- | --- |
| `MONGO_URI` | Atlas SRV string |
| `JWT_SECRET` | Long random string (not the dev default) |
| `CLIENT_ORIGIN` | Your real site URL(s), comma-separated, e.g. `https://your-app.vercel.app` |

Optional:

- `BRACKET_LOCK_AT` — ISO override for default league lock (see `server/src/config/app.config.js`).
- `VITE_API_URL` — Only if the API is on a **different** host than the site. If unset, production builds use same-origin **`/api`** (correct for this single-project setup).

`CLIENT_ORIGIN` is used for CORS; the API also allows any `*.vercel.app` origin so preview URLs work. Production custom domains should still be listed in `CLIENT_ORIGIN` if you add one.

### 4. Seed the bracket on Atlas (once)

From your machine (not on Vercel), point at the same database:

```bash
cd server
export MONGO_URI='mongodb+srv://...your-atlas-uri...'
npm run seed
```

Optional: `npm run migrate-league-results` if you migrated from older global winners.

On the **Hobby** plan, serverless functions are capped at **10s** (configured in `vercel.json`). Upgrade if you need longer cold starts against Atlas.

### 5. Smoke test

Open `https://<deployment>.vercel.app/api/health` — expect `{"ok":true}`. Register a user in the UI, create a league, and confirm data appears in Atlas.

### Local “full stack” with Vercel routing

With [Vercel CLI](https://vercel.com/docs/cli) installed and logged in:

```bash
vercel dev
```

This approximates production routing (static + `/api` function). You still need `MONGO_URI` and friends in `.env` or pulled from Vercel.
