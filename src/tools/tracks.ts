import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.ts";
import {
    withErrorHandling,
    READ_ANNOTATIONS,
    WRITE_ANNOTATIONS,
    DELETE_ANNOTATIONS,
    toolResponse,
} from "./index.ts";

export function registerTrackTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_track",
        {
            title: "Get Track",
            description:
                "Get Spotify catalog information for a single track.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the track."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_track", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/tracks/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_tracks",
        {
            title: "Get Several Tracks",
            description:
                "Get Spotify catalog information for multiple tracks.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 50)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_tracks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/tracks",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_saved_tracks",
        {
            title: "Get User's Saved Tracks",
            description:
                "Get a list of the songs saved in the current user's 'Your Music' library.",
            inputSchema: {
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
                limit: z
                    .number()
                    .optional()
                    .describe(
                        "Maximum number of items to return (1-50, default 20)."
                    ),
                offset: z
                    .number()
                    .optional()
                    .describe(
                        "Index of the first item to return (default 0)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_saved_tracks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/tracks",
                    query: {
                        market: args.market,
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "save_tracks",
        {
            title: "Save Tracks for Current User",
            description:
                "Save one or more tracks to the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 50)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_tracks", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:track:${s.trim()}`)
                    .join(",");
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/library",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_saved_tracks",
        {
            title: "Remove Saved Tracks",
            description:
                "Remove one or more tracks from the current user's library. Pass Spotify track IDs (not URIs) — they will be converted automatically.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 40)."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_saved_tracks", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:track:${s.trim()}`)
                    .join(",");
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: "/me/library",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "check_saved_tracks",
        {
            title: "Check User's Saved Tracks",
            description:
                "Check if one or more tracks are saved in the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 50)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_saved_tracks", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:track:${s.trim()}`)
                    .join(",");
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/library/contains",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

}
