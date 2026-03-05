# Spotify MCP Server

A remote [Model Context Protocol](https://modelcontextprotocol.io) server that provides full coverage of the [Spotify Web API](https://developer.spotify.com/documentation/web-api). Built with [Bun](https://bun.sh), [Hono](https://hono.dev), and [Supabase](https://supabase.com).

## Features

- **85+ tools** covering 100% of the Spotify Web API
- **Remote MCP** via Streamable HTTP transport — no local install required
- **OAuth2 proxy** with PKCE support and dynamic client registration
- **Automatic token refresh** — Spotify tokens are refreshed transparently
- **Encrypted storage** — all Spotify tokens encrypted at rest with AES-256-GCM
- **Supabase backend** — persistent storage for tokens, sessions, and clients

## Tools

| Category | Tools | Examples |
|---|---|---|
| Albums | 8 | Get album, saved albums, new releases |
| Artists | 5 | Get artist, top tracks, related artists |
| Audiobooks | 7 | Get audiobook, chapters, save/remove |
| Categories | 2 | Browse categories |
| Chapters | 2 | Get chapter details |
| Episodes | 6 | Get episode, save/remove/check |
| Genres | 1 | Available genre seeds |
| Library | 3 | Save/remove/check library items (unified) |
| Markets | 1 | Available markets |
| Player | 15 | Play, pause, skip, seek, queue, devices, volume |
| Playlists | 16 | Create, modify, add/remove items, cover images |
| Search | 1 | Search with field filters across all types |
| Shows | 7 | Get show, episodes, save/remove/check |
| Tracks | 11 | Get track, audio features/analysis, recommendations |
| Users | 11 | Profile, top items, follow/unfollow |

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
| `ENCRYPTION_SECRET` | 32-byte hex key — generate with `openssl rand -hex 32` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Your Supabase service role key |
| `PORT` | Server port (default: `3000`) |

### 3. Run Supabase migration

Apply the database schema to your Supabase project:

```bash
supabase db push
```

Or run the SQL manually from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.

### 4. Start the server

```bash
bun run dev
```

## OAuth Flow

This server acts as an OAuth2 proxy between MCP clients and Spotify:

```
MCP Client                    Spotify MCP Server                 Spotify
    │                               │                               │
    ├── POST /register ────────────►│                               │
    │◄── client_id ─────────────────┤                               │
    │                               │                               │
    ├── GET /authorize ────────────►│                               │
    │                               ├── redirect to Spotify ───────►│
    │                               │◄── callback with code ────────┤
    │◄── redirect with MCP code ────┤                               │
    │                               │                               │
    ├── POST /token ───────────────►│                               │
    │                               ├── exchange code ─────────────►│
    │                               │◄── Spotify tokens ────────────┤
    │◄── MCP access token ──────────┤                               │
    │                               │                               │
    ├── POST /mcp (with Bearer) ───►│── Spotify API calls ─────────►│
    │◄── tool results ──────────────┤◄── API responses ─────────────┤
```

## MCP Client Configuration

### Claude Desktop / Claude Code

Add to your MCP settings:

```json
{
  "mcpServers": {
    "spotify": {
      "type": "streamable-http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

The client will be guided through OAuth registration and authorization on first connection.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/register` | POST | Dynamic OAuth client registration |
| `/authorize` | GET | Start OAuth authorization flow |
| `/callback` | GET | Spotify OAuth callback |
| `/token` | POST | Exchange auth code for MCP token |
| `/mcp` | POST/GET/DELETE | MCP Streamable HTTP transport |
| `/health` | GET | Health check |
| `/.well-known/oauth-authorization-server` | GET | OAuth server metadata |

## Development

```bash
bun run dev        # Start with hot reload
bun run lint       # Run ESLint
bun run lint:fix   # Auto-fix lint issues
bun run format     # Format with Prettier
```

## License

MIT
