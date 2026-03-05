import { getSupabaseClient } from "./supabase.ts";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger({ component: "cleanup" });

async function runCleanup() {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { error: tokensError } = await supabase
        .from("mcp_tokens")
        .delete()
        .lt("expires_at", now);

    if (tokensError) {
        logger.warn("Failed to clean up expired mcp_tokens", {
            error: tokensError.message,
        });
    }

    const { error: sessionsError } = await supabase
        .from("oauth_sessions")
        .delete()
        .lt("expires_at", now);

    if (sessionsError) {
        logger.warn("Failed to clean up expired oauth_sessions", {
            error: sessionsError.message,
        });
    }

    const { error: codesError } = await supabase
        .from("auth_codes")
        .delete()
        .lt("expires_at", now);

    if (codesError) {
        logger.warn("Failed to clean up expired auth_codes", {
            error: codesError.message,
        });
    }

    const { error: analyticsError } = await supabase
        .from("tool_analytics")
        .delete()
        .lt("expires_at", now);

    if (analyticsError) {
        logger.warn("Failed to clean up expired tool_analytics", {
            error: analyticsError.message,
        });
    }

    logger.info("Cleanup completed");
}

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function startCleanupScheduler() {
    // Run once on startup
    runCleanup();

    // Then every 24 hours
    setInterval(runCleanup, CLEANUP_INTERVAL_MS);

    logger.info("Cleanup scheduler started (24h interval)");
}
