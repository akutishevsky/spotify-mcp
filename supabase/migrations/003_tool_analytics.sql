-- Analytics table for tracking tool usage per user
-- TTL: 90 days for historical analysis

create table tool_analytics (
    id uuid primary key default gen_random_uuid(),
    spotify_user_id varchar(255) not null,
    tool_name varchar(100) not null,
    success boolean not null,
    duration_ms integer not null,
    error_category varchar(50),
    mcp_session_id varchar(255),
    invoked_at timestamptz not null default now(),
    expires_at timestamptz not null,
    created_at timestamptz default now()
);

create index idx_tool_analytics_user_id on tool_analytics(spotify_user_id);
create index idx_tool_analytics_tool_name on tool_analytics(tool_name);
create index idx_tool_analytics_invoked_at on tool_analytics(invoked_at);
create index idx_tool_analytics_expires_at on tool_analytics(expires_at);
create index idx_tool_analytics_user_tool on tool_analytics(spotify_user_id, tool_name);

-- RLS enabled, no policies — only service_role can access
alter table tool_analytics enable row level security;
revoke all on tool_analytics from anon, authenticated;
