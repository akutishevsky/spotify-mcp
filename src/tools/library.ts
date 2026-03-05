import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.ts";
import {
    withErrorHandling,
    WRITE_ANNOTATIONS,
    DELETE_ANNOTATIONS,
    READ_ANNOTATIONS,
    toolResponse,
} from "./index.ts";

export function registerLibraryTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "save_library_items",
        {
            title: "Save Items to Library",
            description:
                "Save items to the current user's library using Spotify URIs. Supports tracks, albums, episodes, shows, audiobooks, users, and playlists (max 40).",
            inputSchema: {
                uris: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify URIs (max 40). Example: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh,spotify:album:1Je1IMUlBXcx1Fz0WE7oPT'."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_library_items", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/library",
                    query: { uris: args.uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_library_items",
        {
            title: "Remove Items from Library",
            description:
                "Remove items from the current user's library using Spotify URIs (max 40).",
            inputSchema: {
                uris: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify URIs (max 40)."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_library_items", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: "/me/library",
                    query: { uris: args.uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "check_library_contains",
        {
            title: "Check User's Saved Items",
            description:
                "Check if items are saved in the current user's library using Spotify URIs (max 40).",
            inputSchema: {
                uris: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify URIs (max 40)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_library_contains", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/library/contains",
                    query: { uris: args.uris },
                });
                return toolResponse(data);
            })
    );
}
