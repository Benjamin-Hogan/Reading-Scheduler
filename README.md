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
- **Local storage** — data stays in your browser (JSON export/import for backup)
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

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_BOOKS_API_KEY` | Recommended | Avoids rate limits on book search |
| `GOOGLE_CLIENT_ID` | For Calendar export | OAuth 2.0 Web client ID |
| `GOOGLE_CLIENT_SECRET` | For Calendar export | OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | For Calendar export | Default: `http://localhost:3000/api/auth/google/callback` |
| `FEED_DATA_DIR` | For calendar subscription feeds | Directory for persisted feed snapshots (default: `.feed-data` locally, `/tmp/reading-scheduler-feeds` on Vercel) |

### Google Cloud Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Books API** and **Google Calendar API**
3. Create an API key (restrict to Books API)
4. Create OAuth 2.0 Web credentials with these local dev URIs:

| Field | Value |
|---|---|
| Authorized JavaScript origins | `http://localhost:3000` |
| Authorized redirect URIs | `http://localhost:3000/api/auth/google/callback` |

**Important:** Open the app at `http://localhost:3000`, not your LAN IP (`192.168.x.x`). Google OAuth is registered for localhost unless you add the IP separately. If Next.js logs a cross-origin dev warning, use localhost or add your IP to `allowedDevOrigins` in `next.config.ts` and restart the dev server.

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
3. For Google OAuth in production, add your production domain to authorized origins and redirect URIs in Google Cloud Console
4. PWA icons live in `public/icons/`; the service worker caches the manifest and icons for installability

See [docs/architecture.md](docs/architecture.md) for how client storage, the scheduler, and calendar export fit together.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS, shadcn-style UI components
- Dexie.js (IndexedDB)
- Framer Motion, canvas-confetti, Web Audio API sound effects
- Google Books API, Google Calendar API, ICS export

## PWA

The app includes a web manifest and icons in `public/icons/` for installability. On phones, install it to your home screen for a native-like experience with bottom tab navigation. The service worker is **disabled in development** so it does not cache Next.js dev chunks. If the app shows a blank screen after an update, hard-refresh (`Ctrl+Shift+R`) or clear site data for localhost in your browser.
