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
npm run build       # Production build
npm run test        # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run typecheck   # TypeScript check
npm run lint        # ESLint
```

## Deployment

The app deploys cleanly to [Vercel](https://vercel.com/) or any Node.js host that supports Next.js 16.

1. Connect your repository and set the build command to `npm run build`
2. Add the environment variables from the table above in your hosting dashboard
3. Set `SESSION_SECRET` to a long random string in production
4. For durable cloud sync and calendar feeds on Vercel, configure `SYNC_DATA_DIR` and `FEED_DATA_DIR` to a persistent volume (defaults under `/tmp` are ephemeral on serverless)
5. For Google OAuth in production, add your production domain to authorized origins and redirect URIs in Google Cloud Console
6. PWA icons live in `public/icons/`; the service worker caches the manifest and icons for installability

See [docs/architecture.md](docs/architecture.md) for how client storage, the scheduler, and calendar export fit together.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS, shadcn-style UI components
- Dexie.js (IndexedDB)
- Framer Motion, canvas-confetti, Web Audio API sound effects
- Google Books API, Google Calendar API, ICS export

## PWA

The app includes a web manifest and icons in `public/icons/` for installability. On phones, install it to your home screen for a native-like experience with bottom tab navigation. The service worker is **disabled in development** so it does not cache Next.js dev chunks. If the app shows a blank screen after an update, hard-refresh (`Ctrl+Shift+R`) or clear site data for localhost in your browser.
