# Google Cloud setup

Reading Scheduler uses two Google APIs:

| API | Purpose | Auth |
|-----|---------|------|
| **Books API** | Search and metadata | API key |
| **Calendar API** | Export reading events | OAuth 2.0 |

## 1. Create a project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Note the project name — you'll enable APIs on it

## 2. Enable APIs

In **APIs & Services → Library**, enable:

- [Google Books API](https://console.cloud.google.com/apis/library/books.googleapis.com)
- [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)

## 3. Books API key

1. Go to **APIs & Services → Credentials**
2. **Create credentials → API key**
3. Restrict the key (recommended):
   - **API restrictions** → Restrict key → select **Google Books API**
   - For production, add **HTTP referrer** restrictions for your domains
4. Add to `.env.local`:

```bash
GOOGLE_BOOKS_API_KEY=your_api_key_here
```

## 4. OAuth client (Calendar export)

1. **Credentials → Create credentials → OAuth client ID**
2. If prompted, configure the **OAuth consent screen** (External is fine for personal use; add yourself as a test user while in Testing mode)
3. Application type: **Web application**
4. Add **Authorized JavaScript origins** and **Authorized redirect URIs** for every URL you will open the app from:

### Local development (computer)

| Field | Value |
|-------|-------|
| JavaScript origin | `http://localhost:3000` |
| Redirect URI | `http://localhost:3000/api/auth/google/callback` |

### Phone on same WiFi (LAN IP)

Replace `192.168.1.42` with your computer's LAN address (`ipconfig getifaddr en0` on macOS, `hostname -I` on Linux):

| Field | Value |
|-------|-------|
| JavaScript origin | `http://192.168.1.42:3000` |
| Redirect URI | `http://192.168.1.42:3000/api/auth/google/callback` |

### HTTPS tunnel (cloud dev / phone testing)

When using `npm run tunnel`, copy the exact `https://….loca.lt` URL from the terminal. **Add a new origin + redirect pair each time the subdomain changes.**

| Field | Value |
|-------|-------|
| JavaScript origin | `https://your-subdomain.loca.lt` |
| Redirect URI | `https://your-subdomain.loca.lt/api/auth/google/callback` |

For a stable tunnel URL, use a paid ngrok reserved domain or Cloudflare Tunnel with a fixed hostname.

### Production (Docker / self-hosted)

| Field | Value |
|-------|-------|
| JavaScript origin | `https://your-domain.com` |
| Redirect URI | `https://your-domain.com/api/auth/google/callback` |

See [self-hosting.md](./self-hosting.md) for Docker deployment and reverse-proxy setup.

5. Copy the **Client ID** and **Client secret** into `.env.local`:

```bash
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

6. **Do not set `GOOGLE_REDIRECT_URI` in `.env.local` for local/mobile testing.** The app picks the callback URL from the origin you are actually using. Setting it to `localhost` breaks OAuth when you open the app from a LAN IP or tunnel.

## 5. Verify in the app

```bash
cp .env.local.example .env.local
# fill in credentials
npm run dev
```

Open **Settings → Google Calendar**. The setup card shows the **JavaScript origin** and **redirect URI** for your current URL — register those in Google Cloud if you have not already, wait ~1 minute, then click **Connect Google Calendar**.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Add the exact redirect URI from Settings to Google Cloud Console |
| `origin_mismatch` / blocked sign-in | Add the JavaScript origin from Settings |
| OAuth works on laptop but not phone | Register the phone's URL (LAN IP or tunnel), not just localhost |
| `google_error=not_configured` | Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` and restart `npm run dev` |
| Calendar export 403 | Enable Google Calendar API on the project |
| Book search rate limits | Set `GOOGLE_BOOKS_API_KEY` |
