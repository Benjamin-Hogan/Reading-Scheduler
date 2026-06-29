# Self-hosting with Docker

Reading Scheduler is designed to run as a **single container** on your own hardware or VPS. Books and plans stay in each user's browser (IndexedDB); the server handles Google Books search, Google Calendar OAuth/export, and ICS subscription feeds.

## Quick start

```bash
git clone https://github.com/Benjamin-Hogan/Reading-Scheduler.git
cd Reading-Scheduler
cp .env.example .env
# Edit .env — add Google API credentials (see docs/google-cloud-setup.md)
docker compose up -d --build
```

Open `http://localhost:3000` (or your server's IP).

## What runs in the container

| Component | Storage |
|-----------|---------|
| UI + scheduler logic | Built into the image |
| User library & plans | **Browser IndexedDB** (per device) |
| ICS subscription feeds | Docker volume `feed-data` → `/data/feeds` |
| Google OAuth tokens | HTTP-only cookies (per browser session) |

There is no server-side database. Back up library data via **Settings → Export JSON** in the app.

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Host port to publish (default `3000`) |
| `GOOGLE_BOOKS_API_KEY` | Recommended | Book search API key |
| `GOOGLE_CLIENT_ID` | For calendar export | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For calendar export | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Usually omit | Set only if OAuth callback must be fixed, e.g. `https://reading.example.com/api/auth/google/callback` |

`FEED_DATA_DIR` is set automatically in the image to `/data/feeds` and backed by a compose volume.

## Google Cloud for your domain

1. Enable **Books API** and **Calendar API** in [Google Cloud Console](https://console.cloud.google.com/).
2. Create OAuth credentials (Web application).
3. Register your public URL (replace with your hostname):

| Field | Example |
|-------|---------|
| Authorized JavaScript origins | `https://reading.example.com` |
| Authorized redirect URIs | `https://reading.example.com/api/auth/google/callback` |

4. Put the client ID and secret in `.env`.

If you use a reverse proxy with HTTPS, you can leave `GOOGLE_REDIRECT_URI` unset — the app builds the callback from the request `Host` header. Your proxy must forward `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto`.

See [google-cloud-setup.md](./google-cloud-setup.md) for the full walkthrough.

## HTTPS with a reverse proxy

Run the container on an internal port and terminate TLS in front. Example **Caddy**:

```caddy
reading.example.com {
  reverse_proxy reading-scheduler:3000
}
```

Example **nginx**:

```nginx
server {
  listen 443 ssl;
  server_name reading.example.com;

  # ssl_certificate ... (your cert paths)

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

With `docker compose`, either publish only to localhost:

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

or attach the proxy to the same Docker network and proxy to `http://reading-scheduler:3000`.

## Build and run without Compose

```bash
docker build -t reading-scheduler:latest .
docker run -d \
  --name reading-scheduler \
  -p 3000:3000 \
  --env-file .env \
  -e FEED_DATA_DIR=/data/feeds \
  -v reading-scheduler-feeds:/data/feeds \
  --restart unless-stopped \
  reading-scheduler:latest
```

## Updates

```bash
git pull
docker compose up -d --build
```

Feed data in the `feed-data` volume is preserved across rebuilds. User library data lives in browsers — export JSON before major changes if needed.

## Health check

The image exposes a Docker `HEALTHCHECK` on `GET /`. Compose repeats the same check.

```bash
docker compose ps
docker inspect --format='{{.State.Health.Status}}' $(docker compose ps -q)
```

## Resource notes

- **Image**: Node 20 Alpine, Next.js standalone output (~150–200 MB typical).
- **Memory**: 256–512 MB is usually enough for a personal instance.
- **CPU**: Light; spikes during `next build` only at image build time.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Add exact callback URL to Google OAuth client (see Settings page for current values) |
| Calendar feeds disappear after restart | Ensure `/data/feeds` volume is mounted (`docker volume ls`) |
| Blank page after update | Hard-refresh or clear site data; PWA service worker may cache old assets |
| Book search rate limits | Set `GOOGLE_BOOKS_API_KEY` in `.env` |
| OAuth works on HTTP LAN IP only | Google requires HTTPS for non-localhost in production; use a domain + reverse proxy |

## Architecture

Client-first design — see [architecture.md](./architecture.md). The container is stateless except for ICS feed files on disk.
