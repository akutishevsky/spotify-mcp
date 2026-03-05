-- MCP tokens: maps MCP access tokens to encrypted Spotify credentials
create table if not exists mcp_tokens (
    mcp_token text primary key,
    encrypted_access_token text not null,
    encrypted_refresh_token text not null,
    spotify_user_id text not null,
    spotify_expires_at bigint not null,
    expires_at timestamptz not null,
    updated_at timestamptz not null default now()
);

create index if not exists idx_mcp_tokens_expires_at on mcp_tokens (expires_at);

-- OAuth sessions: temporary state during authorization flow
create table if not exists oauth_sessions (
    session_id text primary key,
    state text not null,
    code_challenge text,
    code_challenge_method text,
    redirect_uri text not null,
    client_id text,
    expires_at timestamptz not null
);

create index if not exists idx_oauth_sessions_expires_at on oauth_sessions (expires_at);

-- Auth codes: temporary authorization codes exchanged for tokens
create table if not exists auth_codes (
    code text primary key,
    spotify_code text not null,
    client_id text,
    redirect_uri text not null,
    code_challenge text,
    expires_at timestamptz not null
);

create index if not exists idx_auth_codes_expires_at on auth_codes (expires_at);

-- Registered clients: dynamic OAuth client registration
create table if not exists registered_clients (
    client_id text primary key,
    client_secret text,
    redirect_uris text[] not null default '{}',
    updated_at timestamptz not null default now()
);

-- Enable Row Level Security on all tables
alter table mcp_tokens enable row level security;
alter table oauth_sessions enable row level security;
alter table auth_codes enable row level security;
alter table registered_clients enable row level security;

-- Service role policies (server uses service_role key)
create policy "Service role full access on mcp_tokens"
    on mcp_tokens for all
    using (true)
    with check (true);

create policy "Service role full access on oauth_sessions"
    on oauth_sessions for all
    using (true)
    with check (true);

create policy "Service role full access on auth_codes"
    on auth_codes for all
    using (true)
    with check (true);

create policy "Service role full access on registered_clients"
    on registered_clients for all
    using (true)
    with check (true);
