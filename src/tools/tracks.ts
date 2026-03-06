import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    registerGetTool,
    registerGetSeveralTool,
    registerLibraryTools,
} from "./helpers.ts";

export function registerTrackTools(
    server: McpServer,
    mcpAccessToken: string
) {
    registerGetTool(server, mcpAccessToken, {
        entity: "track",
        plural: "tracks",
    });

    registerGetSeveralTool(server, mcpAccessToken, {
        entity: "track",
        plural: "tracks",
        description:
            "Get Spotify catalog information for multiple tracks.",
    });

    registerLibraryTools(server, mcpAccessToken, {
        entity: "track",
        plural: "tracks",
        getSavedDescription:
            "Get a list of the songs saved in the current user's 'Your Music' library.",
        getSavedHasMarket: true,
        removeDescription:
            "Remove one or more tracks from the current user's library. Pass Spotify track IDs (not URIs) — they will be converted automatically.",
        removeMaxIds: 40,
    });
}
