import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    registerGetTool,
    registerGetSeveralTool,
    registerLibraryTools,
} from "./helpers.ts";

export function registerEpisodeTools(
    server: McpServer,
    mcpAccessToken: string
) {
    registerGetTool(server, mcpAccessToken, {
        entity: "episode",
        plural: "episodes",
    });

    registerGetSeveralTool(server, mcpAccessToken, {
        entity: "episode",
        plural: "episodes",
    });

    registerLibraryTools(server, mcpAccessToken, {
        entity: "episode",
        plural: "episodes",
        getSavedDescription:
            "Get a list of the episodes saved in the current user's library.",
        getSavedHasMarket: true,
    });
}
