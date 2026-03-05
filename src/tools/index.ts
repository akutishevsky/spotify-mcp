import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAlbumTools } from "./albums.js";
import { registerArtistTools } from "./artists.js";
import { registerAudiobookTools } from "./audiobooks.js";
import { registerCategoryTools } from "./categories.js";
import { registerChapterTools } from "./chapters.js";
import { registerEpisodeTools } from "./episodes.js";
import { registerGenreTools } from "./genres.js";
import { registerLibraryTools } from "./library.js";
import { registerMarketTools } from "./markets.js";
import { registerPlayerTools } from "./player.js";
import { registerPlaylistTools } from "./playlists.js";
import { registerSearchTools } from "./search.js";
import { registerShowTools } from "./shows.js";
import { registerTrackTools } from "./tracks.js";
import { registerUserTools } from "./users.js";
import { createLogger } from "../utils/logger.js";

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
