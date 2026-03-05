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

const analyticsLogger = createLogger({ component: "tools" });

export function registerAllTools(
    server: McpServer,
    mcpAccessToken: string
) {
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

export async function withErrorHandling(
    toolName: string,
    handler: () => Promise<ToolResponse>
): Promise<ToolResponse> {
    const startTime = performance.now();
    try {
        const result = await handler();
        const durationMs = Math.round(performance.now() - startTime);
        analyticsLogger.info("tool_invoked", {
            tool: toolName,
            duration_ms: durationMs,
            success: true,
        });
        return result;
    } catch (error) {
        const durationMs = Math.round(performance.now() - startTime);
        analyticsLogger.info("tool_invoked", {
            tool: toolName,
            duration_ms: durationMs,
            success: false,
            error_message:
                error instanceof Error ? error.message : String(error),
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
