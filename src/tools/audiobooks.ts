import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    registerGetTool,
    registerGetSeveralTool,
    registerChildrenTool,
    registerLibraryTools,
} from "./helpers.ts";

export function registerAudiobookTools(
    server: McpServer,
    mcpAccessToken: string
) {
    registerGetTool(server, mcpAccessToken, {
        entity: "audiobook",
        plural: "audiobooks",
        title: "Get an Audiobook",
        description:
            "Get Spotify catalog information for a single audiobook. Only available in US, UK, Canada, Ireland, New Zealand, and Australia.",
    });

    registerGetSeveralTool(server, mcpAccessToken, {
        entity: "audiobook",
        plural: "audiobooks",
    });

    registerChildrenTool(server, mcpAccessToken, {
        entity: "audiobook",
        plural: "audiobooks",
        children: "chapters",
    });

    registerLibraryTools(server, mcpAccessToken, {
        entity: "audiobook",
        plural: "audiobooks",
        getSavedDescription:
            "Get a list of the audiobooks saved in the current user's library.",
    });
}
