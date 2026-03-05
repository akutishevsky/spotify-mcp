import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAlbumTools } from "./albums.ts";
import { registerArtistTools } from "./artists.ts";
import { registerAudiobookTools } from "./audiobooks.ts";
import { registerCategoryTools } from "./categories.ts";
import { registerChapterTools } from "./chapters.ts";
import { registerEpisodeTools } from "./episodes.ts";
import { registerGenreTools } from "./genres.ts";
import { registerLibraryTools } from "./library.ts";
import { registerMarketTools } from "./markets.ts";
import { registerPlayerTools } from "./player.ts";
import { registerPlaylistTools } from "./playlists.ts";
import { registerSearchTools } from "./search.ts";
import { registerShowTools } from "./shows.ts";
import { registerTrackTools } from "./tracks.ts";
import { registerUserTools } from "./users.ts";
import { createLogger } from "../utils/logger.ts";
import { getSupabaseClient } from "../db/supabase.ts";
import { tokenStore } from "../auth/token-store.ts";

const analyticsLogger = createLogger({ component: "tools" });

const ANALYTICS_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

let currentMcpToken: string | undefined;

export function registerAllTools(
    server: McpServer,
    mcpAccessToken: string
) {
    currentMcpToken = mcpAccessToken;

    registerAlbumTools(server, mcpAccessToken);
    registerArtistTools(server, mcpAccessToken);
    registerAudiobookTools(server, mcpAccessToken);
    registerCategoryTools(server, mcpAccessToken);
    registerChapterTools(server, mcpAccessToken);
    registerEpisodeTools(server, mcpAccessToken);
    registerGenreTools(server, mcpAccessToken);
    registerLibraryTools(server, mcpAccessToken);
    registerMarketTools(server, mcpAccessToken);
    registerPlayerTools(server, mcpAccessToken);
    registerPlaylistTools(server, mcpAccessToken);
    registerSearchTools(server, mcpAccessToken);
    registerShowTools(server, mcpAccessToken);
    registerTrackTools(server, mcpAccessToken);
    registerUserTools(server, mcpAccessToken);
}

export const READ_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
} as const;

export const WRITE_ANNOTATIONS = {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
} as const;

export const DELETE_ANNOTATIONS = {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
} as const;

interface ToolResponse {
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
}

export function toolResponse(data: unknown): ToolResponse {
    return {
        content: [
            { type: "text", text: JSON.stringify(data, null, 2) },
        ],
    };
}

function categorizeError(error: unknown): string {
    const message =
        error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    if (lower.includes("expired") || lower.includes("invalid or expired"))
        return "auth_expired";
    if (lower.includes("rate limit") || lower.includes("429"))
        return "rate_limited";
    if (lower.includes("not found") || lower.includes("404"))
        return "not_found";
    if (lower.includes("forbidden") || lower.includes("403"))
        return "forbidden";
    if (lower.includes("premium")) return "premium_required";
    if (lower.includes("fetch") || lower.includes("network"))
        return "network_error";
    return "unknown";
}

interface AnalyticsRecord {
    spotify_user_id: string;
    tool_name: string;
    success: boolean;
    duration_ms: number;
    error_category?: string;
    invoked_at: string;
    expires_at: string;
}

async function persistAnalytics(record: AnalyticsRecord): Promise<void> {
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from("tool_analytics")
            .insert(record);

        if (error) {
            analyticsLogger.warn("Failed to persist analytics", {
                error: error.message,
                tool: record.tool_name,
            });
        }
    } catch (err) {
        analyticsLogger.warn("Analytics persistence error", {
            error: err instanceof Error ? err.message : String(err),
            tool: record.tool_name,
        });
    }
}

export async function withErrorHandling(
    toolName: string,
    handler: () => Promise<ToolResponse>
): Promise<ToolResponse> {
    const startTime = performance.now();
    let success = true;
    let errorCategory: string | undefined;
    let result: ToolResponse;

    try {
        result = await handler();
        const durationMs = Math.round(performance.now() - startTime);
        analyticsLogger.info("tool_invoked", {
            tool: toolName,
            duration_ms: durationMs,
            success: true,
        });
    } catch (error) {
        success = false;
        errorCategory = categorizeError(error);
        const durationMs = Math.round(performance.now() - startTime);
        analyticsLogger.info("tool_invoked", {
            tool: toolName,
            duration_ms: durationMs,
            success: false,
            error_category: errorCategory,
        });
        result = {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }

    // Persist analytics to Supabase (fire-and-forget)
    if (currentMcpToken) {
        const durationMs = Math.round(performance.now() - startTime);
        const now = new Date();

        tokenStore.getTokens(currentMcpToken).then((tokens) => {
            const userId = tokens?.spotifyUserId || "unknown";
            persistAnalytics({
                spotify_user_id: userId,
                tool_name: toolName,
                success,
                duration_ms: durationMs,
                error_category: errorCategory,
                invoked_at: now.toISOString(),
                expires_at: new Date(
                    now.getTime() + ANALYTICS_TTL_MS
                ).toISOString(),
            });
        });
    }

    return result;
}
