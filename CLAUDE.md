# Spotify MCP Server

Remote MCP server for the Spotify Web API, built with Bun + Hono + Supabase.

## Runtime

- **Bun** is the runtime. Use `bun` instead of `node`, `bun install` instead of `npm install`, `bun run <script>` instead of `npm run`, `bunx` instead of `npx`.
- Bun automatically loads `.env` — don't use dotenv.
- Use `bun test` for tests (`import { test, expect } from "bun:test"`).

## Stack

- **Hono** for HTTP routing and middleware. Server exports default `{ port, fetch }` for Bun.
- **Supabase** for persistent storage (tokens, OAuth sessions, auth codes, registered clients).
- **MCP SDK** (`@modelcontextprotocol/sdk`) with `WebStandardStreamableHTTPServerTransport`.
- **Zod** for tool input schema validation.
- **AES-256-GCM** encryption for Spotify tokens at rest (`src/utils/encryption.ts`).

## Project Structure

```
src/
├── index.ts              # Entry point (Hono default export)
├── config.ts             # OAuth config singleton
├── server/
│   ├── app.ts            # Hono app (middleware, routes, CORS)
│   ├── middleware.ts      # Bearer token auth middleware
│   └── mcp-endpoints.ts  # MCP session management
├── auth/
│   ├── oauth.ts          # OAuth2 proxy flow (register, authorize, callback, token)
│   └── token-store.ts    # MCP token → Spotify token mapping
├── db/
│   └── supabase.ts       # Supabase client singleton
├── spotify/
│   └── api.ts            # Spotify API client with auto token refresh
├── tools/                # 15 tool modules (85+ tools total)
│   ├── index.ts          # Tool registration hub + annotations
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
supabase/
└── migrations/           # SQL migrations for Supabase tables
```

## Scripts

- `bun run dev` — start dev server with hot reload
- `bun run lint` — run ESLint
- `bun run lint:fix` — run ESLint with auto-fix
- `bun run format` — format with Prettier

## Key Patterns

- **OAuth2 proxy**: MCP client registers → authorizes → redirects to Spotify → callback exchanges code → issues MCP token.
- **Token refresh**: `spotifyRequest()` in `src/spotify/api.ts` auto-refreshes Spotify tokens when they expire within 5 minutes.
- **Tool structure**: Each tool module exports a `register*Tools(server, mcpAccessToken)` function. Tools use `withErrorHandling()` wrapper and `toolResponse()` for consistent responses.
- **Annotations**: `READ_ANNOTATIONS`, `WRITE_ANNOTATIONS`, `DELETE_ANNOTATIONS` in `src/tools/index.ts`.
- All Spotify tokens are encrypted at rest with AES-256-GCM before storing in Supabase.

## Environment Variables

- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `SPOTIFY_REDIRECT_URI` — Spotify app credentials
- `ENCRYPTION_SECRET` — 32-byte hex key for AES-256-GCM
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY` — Supabase project credentials
- `PORT` — server port (default 3000)

## Claude Code Operating Instructions

### Core Philosophy

Default to **parallel execution** and **web-verified information**. Sequential execution and offline assumptions are fallback modes, not defaults. When in doubt: parallelize, then search.

---

### 1. Parallelization Protocol

**Before starting any multi-step task:**
1. Decompose the full task into atomic subtasks
2. Build a dependency graph — identify which subtasks have no prerequisite outputs
3. Dispatch ALL dependency-free subtasks simultaneously using parallel tool calls
4. Only after their completion, dispatch the next wave of now-unblocked subtasks
5. Repeat until task is complete

**Rule:** If two tasks do not share an input/output dependency, they MUST run in parallel. Sequential execution of independent tasks is a performance violation.

### 2. Web Search Mandate

**Always perform a web search before proceeding** when the task involves:
- Library/framework versions, API behavior, security advisories, best practices, configuration options, error messages, compatibility, pricing/limits.

**Rules:**
- Search before assuming — do not rely on training knowledge for things that change over time.
- Prefer official sources (official docs > GitHub releases > blogs > forums).
- Surface what you found — briefly state the source.
- Do not search for internal project details or code that exists in the repo.

### 3. Quality and Safety

- No unverified version pinning.
- No silent failures in parallel batches — halt dependent tasks and report.
- Do not hallucinate tool flags or API parameters — search first if unsure.

### 4. Communication

- Keep explanations concise — action over narration.
- When web search informs a decision, cite source.
- When sequential execution is chosen over parallel, briefly state the dependency.
