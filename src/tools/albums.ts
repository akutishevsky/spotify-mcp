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

export function registerAlbumTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_album",
        {
            title: "Get Album",
            description:
                "Get Spotify catalog information for a single album.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the album."),
                market: z
                    .string()
                    .optional()
                    .describe(
                        "An ISO 3166-1 alpha-2 country code to apply Track Relinking."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_album", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/albums/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_albums",
        {
            title: "Get Several Albums",
            description:
                "Get Spotify catalog information for multiple albums identified by their Spotify IDs.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify album IDs (max 20)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_albums", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/albums",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_album_tracks",
        {
            title: "Get Album Tracks",
            description:
                "Get Spotify catalog information about an album's tracks.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the album."),
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
            withErrorHandling("get_album_tracks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/albums/${args.id}/tracks`,
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
        "get_saved_albums",
        {
            title: "Get User's Saved Albums",
            description:
                "Get a list of the albums saved in the current Spotify user's library.",
            inputSchema: {
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
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_saved_albums", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/albums",
                    query: {
                        limit: args.limit,
                        offset: args.offset,
                        market: args.market,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "save_albums",
        {
            title: "Save Albums for Current User",
            description:
                "Save one or more albums to the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify album IDs (max 20)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_albums", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:album:${s.trim()}`)
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
        "remove_saved_albums",
        {
            title: "Remove Saved Albums",
            description:
                "Remove one or more albums from the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify album IDs (max 20)."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_saved_albums", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:album:${s.trim()}`)
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
        "check_saved_albums",
        {
            title: "Check User's Saved Albums",
            description:
                "Check if one or more albums are already saved in the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify album IDs (max 20)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_saved_albums", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:album:${s.trim()}`)
                    .join(",");
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/library/contains",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_new_releases",
        {
            title: "Get New Releases",
            description:
                "Get a list of new album releases featured in Spotify.",
            inputSchema: {
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
            withErrorHandling("get_new_releases", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/browse/new-releases",
                    query: {
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );
}
