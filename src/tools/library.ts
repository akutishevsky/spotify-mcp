import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.js";
import {
    withErrorHandling,
    WRITE_ANNOTATIONS,
    DELETE_ANNOTATIONS,
    READ_ANNOTATIONS,
    toolResponse,
} from "./index.js";

export function registerLibraryTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "save_library_items",
        {
            title: "Save Items to Library",
            description:
                "Save items (albums, tracks, episodes, audiobooks, shows) to the current user's library. This is a generic endpoint - for type-specific operations, use the dedicated save tools.",
            inputSchema: {
                type: z
                    .string()
                    .describe(
                        "The type of items to save: albums, tracks, episodes, audiobooks, or shows."
                    ),
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify IDs."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_library_items", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: `/me/${args.type}`,
                    body: { ids: args.ids.split(",").map((s) => s.trim()) },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_library_items",
        {
            title: "Remove Items from Library",
            description:
                "Remove items (albums, tracks, episodes, audiobooks, shows) from the current user's library.",
            inputSchema: {
                type: z
                    .string()
                    .describe(
                        "The type of items to remove: albums, tracks, episodes, audiobooks, or shows."
                    ),
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify IDs."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_library_items", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: `/me/${args.type}`,
                    body: { ids: args.ids.split(",").map((s) => s.trim()) },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "check_library_contains",
        {
            title: "Check User's Saved Items",
            description:
                "Check if items (albums, tracks, episodes, audiobooks, shows) are saved in the current user's library.",
            inputSchema: {
                type: z
                    .string()
                    .describe(
                        "The type of items to check: albums, tracks, episodes, audiobooks, or shows."
                    ),
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify IDs."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_library_contains", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/me/${args.type}/contains`,
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );
}
