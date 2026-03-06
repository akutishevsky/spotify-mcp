import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetTool, registerGetSeveralTool } from "./helpers.ts";

export function registerChapterTools(
    server: McpServer,
    mcpAccessToken: string
) {
    registerGetTool(server, mcpAccessToken, {
        entity: "chapter",
        plural: "chapters",
        title: "Get a Chapter",
        description:
            "Get Spotify catalog information for a single audiobook chapter. Only available in US, UK, Canada, Ireland, New Zealand, and Australia.",
    });

    registerGetSeveralTool(server, mcpAccessToken, {
        entity: "chapter",
        plural: "chapters",
        description:
            "Get Spotify catalog information for several audiobook chapters.",
    });
}
