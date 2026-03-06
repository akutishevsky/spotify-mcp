# Spotify MCP Server

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=bugs)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=akutishevsky_spotify-mcp&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=akutishevsky_spotify-mcp)

A remote [Model Context Protocol](https://modelcontextprotocol.io) server that provides full coverage of the [Spotify Web API](https://developer.spotify.com/documentation/web-api). Built with [Bun](https://bun.sh), [Hono](https://hono.dev), and [Supabase](https://supabase.com).

**Live server:** [sptfy-mcp.online](https://sptfy-mcp.online)

## Quick Setup

### Claude.ai

1. Go to **Customize** > **Connectors** > **Add Custom Connector**
2. Set **Name** to `Spotify` and **URL** to `https://sptfy-mcp.online/mcp`
3. Save and authorize with your Spotify account

### Claude Desktop / Claude Code / Cursor

Add to your MCP client config:

```json
{
  "mcpServers": {
    "spotify": {
      "type": "streamable-http",
      "url": "https://sptfy-mcp.online/mcp"
    }
  }
}
```

On first connection you'll be guided through Spotify authorization — no API keys or local setup needed.

## Features

- **80 tools** covering the Spotify Web API
- **Remote MCP** via Streamable HTTP transport — no local install required
- **OAuth2 proxy** with PKCE support and dynamic client registration
- **Automatic token refresh** — Spotify tokens are refreshed transparently
- **Encrypted storage** — all Spotify tokens encrypted at rest with AES-256-GCM
- **Supabase backend** — persistent storage for tokens, sessions, and clients
- **Tool analytics** — anonymous usage tracking with 90-day retention
- **Scheduled cleanup** — automatic purge of expired tokens, sessions, and analytics
- **Landing page** with live health status

## Tools

| Category | Tools | Examples |
|---|---|---|
| Albums | 7 | Get album, saved albums, save/remove/check |
| Artists | 4 | Get artist, top tracks, albums |
| Audiobooks | 7 | Get audiobook, chapters, save/remove |
| Chapters | 2 | Get chapter details |
| Episodes | 6 | Get episode, save/remove/check |
| Library | 3 | Save/remove/check library items (unified) |
| Markets | 1 | Available markets |
| Player | 15 | Play, pause, skip, seek, queue, devices, volume |
| Playlists | 12 | Create, modify, add/remove items, cover images |
| Search | 1 | Search with field filters across all types |
| Shows | 7 | Get show, episodes, save/remove/check |
| Tracks | 6 | Get track, saved tracks, save/remove/check |
| Users | 10 | Profile, top items, follow/unfollow |

All save/remove/check library operations use the new unified Spotify `/me/library` endpoint with Spotify URIs.

## Prerequisites

- [Bun](https://bun.sh) v1.3+
- A [Spotify Developer App](https://developer.spotify.com/dashboard)
- A [Supabase](https://supabase.com) project

## Setup

### 1. Clone and install

```bash
git clone https://github.com/akutishevsky/spotify-mcp.git
cd spotify-mcp
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the values:

| Variable | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | From your Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | From your Spotify Developer Dashboard |
| `SPOTIFY_REDIRECT_URI` | Must match your Spotify app settings (e.g. `http://localhost:3000/callback`) |
| `ENCRYPTION_SECRET` | 32-byte hex key — generate with `bun run generate:secret` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Your Supabase service role key |
| `PORT` | Server port (default: `3000`) |

### 3. Run Supabase migrations

Apply the database schema to your Supabase project:

```bash
supabase db push
```

Or run the SQL files manually from `supabase/migrations/` in the Supabase SQL editor:
1. `001_initial_schema.sql` — Core tables (mcp_tokens, oauth_sessions, auth_codes, registered_clients) with RLS
2. `002_fix_rls_policies.sql` — Tighten RLS policies
3. `003_tool_analytics.sql` — Tool analytics table with indexes
4. `004_add_granted_scopes.sql` — Granted scopes tracking on mcp_tokens

### 4. Start the server

```bash
bun run dev
```

## OAuth Flow

This server acts as an OAuth2 proxy between MCP clients and Spotify:

```
MCP Client                    Spotify MCP Server                 Spotify
    |                               |                               |
    |-- POST /register ----------->|                               |
    |<-- client_id ----------------|                               |
    |                               |                               |
    |-- GET /authorize ----------->|                               |
    |                               |-- redirect to Spotify ------>|
    |                               |<-- callback with code -------|
    |<-- redirect with MCP code ---|                               |
    |                               |                               |
    |-- POST /token -------------->|                               |
    |                               |-- exchange code ------------>|
    |                               |<-- Spotify tokens -----------|
    |<-- MCP access token ---------|                               |
    |                               |                               |
    |-- POST /mcp (with Bearer) -->|-- Spotify API calls -------->|
    |<-- tool results -------------|<-- API responses ------------|
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Landing page with live health status |
| `/register` | POST | Dynamic OAuth client registration |
| `/authorize` | GET | Start OAuth authorization flow |
| `/callback` | GET | Spotify OAuth callback |
| `/token` | POST | Exchange auth code for MCP token |
| `/mcp` | POST/GET/DELETE | MCP Streamable HTTP transport |
| `/health` | GET | Health check (JSON) |
| `/.well-known/oauth-authorization-server` | GET | OAuth server metadata |

## Scripts

```bash
bun run dev              # Start with hot reload
bun run start            # Production start
bun run lint             # Run ESLint
bun run lint:fix         # Auto-fix lint issues
bun run format           # Format with Prettier
bun run generate:secret  # Generate encryption key
bun run inspector        # Launch MCP Inspector
```

## Deployment

The server includes a `Dockerfile` for container-based deployments (e.g. Digital Ocean App Platform). The `idleTimeout` is set to 255 seconds to support long-lived SSE streams.

## License

MIT
