import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    registerGetTool,
    registerGetSeveralTool,
    registerChildrenTool,
    registerLibraryTools,
} from "./helpers.ts";

export function registerShowTools(
    server: McpServer,
    mcpAccessToken: string
) {
    registerGetTool(server, mcpAccessToken, {
        entity: "show",
        plural: "shows",
        description:
            "Get Spotify catalog information for a single show (podcast).",
    });

    registerGetSeveralTool(server, mcpAccessToken, {
        entity: "show",
        plural: "shows",
    });

    registerChildrenTool(server, mcpAccessToken, {
        entity: "show",
        plural: "shows",
        children: "episodes",
    });

    registerLibraryTools(server, mcpAccessToken, {
        entity: "show",
        plural: "shows",
        removeHasMarket: true,
    });
}
