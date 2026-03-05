# Spotify MCP Server

Remote MCP server for the Spotify Web API, built with Bun + Hono + Supabase.

## Runtime

- **Bun** is the runtime. Use `bun` instead of `node`, `bun install` instead of `npm install`, `bun run <script>` instead of `npm run`, `bunx` instead of `npx`.
- Bun automatically loads `.env` — don't use dotenv.
- Use `bun test` for tests (`import { test, expect } from "bun:test"`).

## Stack

- **Hono** for HTTP routing and middleware. Server exports default `{ port, fetch, idleTimeout }` for Bun.
- **Supabase** for persistent storage (tokens, OAuth sessions, auth codes, registered clients, tool analytics).
- **MCP SDK** (`@modelcontextprotocol/sdk`) with `WebStandardStreamableHTTPServerTransport`.
- **Zod** for tool input schema validation.
- **AES-256-GCM** encryption for Spotify tokens at rest (`src/utils/encryption.ts`).

## Project Structure

```
src/
├── index.ts              # Entry point (Hono default export with idleTimeout: 255)
├── config.ts             # OAuth config singleton
├── server/
│   ├── app.ts            # Hono app (middleware, routes, CORS, CSP, landing page)
│   ├── middleware.ts      # Bearer token auth middleware
│   └── mcp-endpoints.ts  # MCP session management
├── auth/
│   ├── oauth.ts          # OAuth2 proxy flow (register, authorize, callback, token)
│   └── token-store.ts    # MCP token → Spotify token mapping (with granted scopes)
├── db/
│   ├── supabase.ts       # Supabase client singleton
│   └── cleanup.ts        # Scheduled cleanup (24h) for expired data
├── spotify/
│   └── api.ts            # Spotify API client with auto token refresh
├── tools/                # 16 tool modules (85+ tools total)
│   ├── index.ts          # Tool registration hub + analytics + annotations
│   ├── albums.ts, artists.ts, audiobooks.ts, categories.ts,
│   ├── chapters.ts, episodes.ts, genres.ts, library.ts,
│   ├── markets.ts, player.ts, playlists.ts, search.ts,
│   ├── shows.ts, tracks.ts, users.ts
├── types/
│   ├── hono.ts           # Hono app environment types
│   └── spotify.ts        # Spotify Web API response types
└── utils/
    ├── encryption.ts     # AES-256-GCM encrypt/decrypt
    └── logger.ts         # Privacy-safe structured logger
public/
├── index.html            # Landing page with live health polling
├── styles/index.css      # Spotify-themed styles
└── icon.png              # Favicon
supabase/
└── migrations/           # SQL migrations (001-004)
```

## Scripts

- `bun run dev` — start dev server with hot reload
- `bun run start` — production start
- `bun run lint` — run ESLint
- `bun run lint:fix` — run ESLint with auto-fix
- `bun run format` — format with Prettier
- `bun run generate:secret` — generate 32-byte hex encryption key
- `bun run inspector` — launch MCP Inspector

## Key Patterns

- **OAuth2 proxy**: MCP client registers → authorizes → redirects to Spotify (with `show_dialog=true`) → callback exchanges code → issues MCP token. Granted scopes are stored in `mcp_tokens.granted_scopes`.
- **Token refresh**: `spotifyRequest()` in `src/spotify/api.ts` auto-refreshes Spotify tokens when they expire within 5 minutes.
- **Tool structure**: Each tool module exports a `register*Tools(server, mcpAccessToken)` function. Tools use `withErrorHandling()` wrapper and `toolResponse()` for consistent responses.
- **Library endpoints**: All save/remove/check library tools use the new unified `/me/library` and `/me/library/contains` endpoints with Spotify URIs (`spotify:{type}:{id}`). The old type-specific endpoints (`/me/tracks`, `/me/albums`, etc.) are deprecated by Spotify.
- **Annotations**: `READ_ANNOTATIONS`, `WRITE_ANNOTATIONS`, `DELETE_ANNOTATIONS` in `src/tools/index.ts`.
- **Tool analytics**: `withErrorHandling()` persists usage data to `tool_analytics` table (fire-and-forget). User IDs are SHA-256 hashed and truncated to 16 chars. 90-day TTL.
- **Cleanup scheduler**: `src/db/cleanup.ts` runs every 24h, purging expired tokens, sessions, auth codes, and analytics.
- All Spotify tokens are encrypted at rest with AES-256-GCM before storing in Supabase.
- **HTTPS redirect**: Skipped when behind reverse proxy (checks `x-forwarded-for`). Digital Ocean terminates TLS.
- **SSE streams**: `idleTimeout: 255` (max Bun allows) prevents premature connection close.

## Database Tables (Supabase)

- `mcp_tokens` — MCP token → encrypted Spotify tokens, user ID, expiry, granted scopes
- `oauth_sessions` — Temporary OAuth state during authorization flow
- `auth_codes` — Temporary auth codes for token exchange
- `registered_clients` — Dynamic OAuth client registrations
- `tool_analytics` — Tool invocation metrics (anonymized)

All tables use RLS with `service_role` only access (anon/authenticated revoked).

## Environment Variables

- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `SPOTIFY_REDIRECT_URI` — Spotify app credentials
- `ENCRYPTION_SECRET` — 32-byte hex key for AES-256-GCM
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY` — Supabase project credentials
- `PORT` — server port (default 3000)

## Deployment

- **Digital Ocean App Platform** with Bun Dockerfile
- Live at `https://sptfy-mcp.online`
- MCP endpoint: `https://sptfy-mcp.online/mcp`
