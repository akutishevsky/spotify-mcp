import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    registerGetTool,
    registerGetSeveralTool,
    registerChildrenTool,
    registerLibraryTools,
} from "./helpers.ts";

export function registerAlbumTools(
    server: McpServer,
    mcpAccessToken: string
) {
    registerGetTool(server, mcpAccessToken, {
        entity: "album",
        plural: "albums",
        description:
            "Get Spotify catalog information for a single album.",
        marketDescription:
            "An ISO 3166-1 alpha-2 country code to apply Track Relinking.",
    });

    registerGetSeveralTool(server, mcpAccessToken, {
        entity: "album",
        plural: "albums",
        maxIds: 20,
        description:
            "Get Spotify catalog information for multiple albums identified by their Spotify IDs.",
    });

    registerChildrenTool(server, mcpAccessToken, {
        entity: "album",
        plural: "albums",
        children: "tracks",
    });

    registerLibraryTools(server, mcpAccessToken, {
        entity: "album",
        plural: "albums",
        maxIds: 20,
        getSavedDescription:
            "Get a list of the albums saved in the current Spotify user's library.",
        getSavedHasMarket: true,
        checkDescription:
            "Check if one or more albums are already saved in the current user's library.",
    });
}
