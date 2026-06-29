# Reading Scheduler

Plan multi-book reading schedules and live from your calendar — not a daily habit tracker.

## Features

- **Google Books search** — find books and add them to your library
- **Manual book entry** — add books with custom page counts
- **Book status** — want-to-read, reading, or finished
- **Rich book metadata** — description, publisher, categories, tags, notes, rating, and dates (auto-filled from Google Books when available)
- **Multi-book plans** — read in parallel, one after another, or custom order
- **Timeline preview** — see pages/day and feasibility before committing
- **Plan templates** — save and reuse rhythm presets in Settings
- **Today's reading** — see today's assignments when you visit
- **Schedule recalculation** — rebuild assignments from current progress
- **Calendar export** — download `.ics` or push to Google Calendar
- **Calendar subscription feed** — publish a live `.ics` URL that updates when you recalculate the plan
- **Calendar cleanup** — optionally remove Google Calendar events when deleting a plan
- **Light progress tracking** — update your current page when you visit
- **Reading stats** — pages this week, books finished, active plans
- **Past plans** — browse active, completed, and archived plans
- **Cloud sync** — sign in with Google to sync library, plans, and progress across phone and desktop
- **Local storage** — offline-first IndexedDB cache with JSON export/import for manual backup
- **Polished UI** — animated backgrounds, spring transitions, confetti celebrations, and optional sound effects with volume control (Settings → Experience)
- **Mobile-friendly** — bottom tab navigation, touch-friendly controls, safe-area support, and bottom-sheet dialogs on small screens

## Workflow

1. Add books to your library (`/books/new`)
2. Create a reading plan (`/plans/new`)
3. Export to Google Calendar or download `.ics`
4. Follow your schedule from your calendar
5. Occasionally update progress and recalculate if you fall behind

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# Fill in Google API credentials (optional for local dev without search/calendar)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Phone / mobile testing

**Same WiFi as your computer (local dev):**

1. Run `npm run dev:mobile` (binds on all interfaces; default in Next.js 16).
2. Find your computer's LAN IP (e.g. `192.168.1.42` on macOS/Linux: `ipconfig getifaddr en0` or `hostname -I`).
3. On your phone (same WiFi), open `http://<your-lan-ip>:3000`.
4. If you see cross-origin dev errors, add your IP to `allowedDevOrigins` in `next.config.ts` and restart.

**Cloud / remote workspace (Cursor agent, Codespaces, etc.):**

The `Network: http://172.x.x.x:3000` address is **internal to the VM** — your phone cannot reach it. Use a tunnel:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run tunnel
```

Open the `https://….loca.lt` URL on your phone. First visit may ask for your public IP as a password (shown in the tunnel terminal or at https://loca.lt/mytunnelpassword).

**Google on mobile:** In Settings, copy the origin and redirect URI into Google Cloud Console for your tunnel or LAN URL, then connect. See [docs/google-cloud-setup.md](docs/google-cloud-setup.md).

# Google Cloud setup

See **[docs/google-cloud-setup.md](docs/google-cloud-setup.md)** for step-by-step instructions (APIs, OAuth client, mobile/tunnel URLs).

Quick start:

```bash
cp .env.local.example .env.local
# Add GOOGLE_BOOKS_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
npm run dev
```

Open **Settings → Google Calendar** — copy the JavaScript origin and redirect URI shown there into [Google Cloud Console](https://console.cloud.google.com/apis/credentials) for whatever URL you use (localhost, LAN IP, or tunnel).

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_BOOKS_API_KEY` | Recommended | Avoids rate limits on book search |
| `GOOGLE_CLIENT_ID` | For Calendar export | OAuth 2.0 Web client ID |
| `GOOGLE_CLIENT_SECRET` | For Calendar export | OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | Usually omit | Leave unset so OAuth uses your current origin. Set only for a fixed production callback. |
| `FEED_DATA_DIR` | For calendar subscription feeds | Persisted at `/data/feeds` in Docker (volume). Default `.feed-data` locally. |
| `SESSION_SECRET` | Required in production | HMAC secret for signing cloud sync session cookies |
| `SYNC_DATA_DIR` | Recommended in production | Per-user cloud sync snapshots. Persisted at `/data/sync` in Docker (volume). |

### Google Cloud Setup (localhost only)

For computer-only dev, add to your OAuth client:

| Field | Value |
|---|---|
| Authorized JavaScript origins | `http://localhost:3000` |
| Authorized redirect URIs | `http://localhost:3000/api/auth/google/callback` |

For phone (LAN or tunnel), add those URLs too — see the setup guide and the URLs in Settings.

## Scripts

```bash
npm run dev         # Development server
npm run dev:mobile  # Dev server on all interfaces
npm run tunnel      # localtunnel for remote phone testing
npm run build       # Production build
npm run start       # Production server (after build)
npm run test        # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run typecheck   # TypeScript check
npm run lint        # ESLint
```

## CI / container registry

On push to `master` and version tags (`v*`), GitHub Actions:

- **CI** — typecheck, lint, test, Next.js build
- **Docker** — build and push to `ghcr.io/benjamin-hogan/reading-scheduler`

PRs run a Docker build (no push) to verify the image builds.

## Deployment

### Self-hosted (Docker) — recommended

Run on your own server, NAS, or homelab.

**Pull the published image** (built by CI on every push to `master`):

```bash
cp .env.example .env
# Add Google credentials and SESSION_SECRET — see docs/self-hosting.md
docker compose -f docker-compose.ghcr.yml up -d
```

Image: `ghcr.io/benjamin-hogan/reading-scheduler:latest`

**Or build locally:**

```bash
docker compose up -d --build
```

Full guide: **[docs/self-hosting.md](docs/self-hosting.md)** (GHCR auth, reverse proxy, HTTPS, volumes).

The image uses Next.js **standalone** output. ICS feeds and cloud sync persist in Docker volumes (`feed-data`, `sync-data`). Local IndexedDB remains the offline cache — use Settings → Export JSON for manual backups.

### Vercel / managed Node

The app also deploys to [Vercel](https://vercel.com/) or any Node.js host:

1. Set build command to `npm run build` and start command to `npm run start`
2. Add environment variables from the table above
3. Set `SESSION_SECRET` to a long random string in production
4. For durable cloud sync and calendar feeds, configure `SYNC_DATA_DIR` and `FEED_DATA_DIR` to persistent storage
5. Register your production domain in Google Cloud Console for OAuth

See [docs/architecture.md](docs/architecture.md) for how client storage, the scheduler, and calendar export fit together.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS, shadcn-style UI components
- Dexie.js (IndexedDB)
- Framer Motion, canvas-confetti, Web Audio API sound effects
- Google Books API, Google Calendar API, ICS export

## PWA

The app includes a web manifest and icons in `public/icons/` for installability. On phones, install it to your home screen for a native-like experience with bottom tab navigation. The service worker is **disabled in development** so it does not cache Next.js dev chunks. If the app shows a blank screen after an update, hard-refresh (`Ctrl+Shift+R`) or clear site data for localhost in your browser.
