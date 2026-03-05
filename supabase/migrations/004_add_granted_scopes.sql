-- Add granted_scopes column to track which Spotify scopes were authorized
alter table mcp_tokens add column if not exists granted_scopes text;
