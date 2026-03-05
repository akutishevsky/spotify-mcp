-- Fix: remove open RLS policies that allowed anon/authenticated access.
-- The service_role key bypasses RLS, so no policies are needed.

drop policy if exists "Service role full access on mcp_tokens" on mcp_tokens;
drop policy if exists "Service role full access on oauth_sessions" on oauth_sessions;
drop policy if exists "Service role full access on auth_codes" on auth_codes;
drop policy if exists "Service role full access on registered_clients" on registered_clients;

-- Revoke direct table access from public roles as defense-in-depth
revoke all on mcp_tokens from anon, authenticated;
revoke all on oauth_sessions from anon, authenticated;
revoke all on auth_codes from anon, authenticated;
revoke all on registered_clients from anon, authenticated;
