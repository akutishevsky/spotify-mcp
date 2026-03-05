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

export function registerShowTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_show",
        {
            title: "Get Show",
            description:
                "Get Spotify catalog information for a single show (podcast).",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the show."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_show", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/shows/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_shows",
        {
            title: "Get Several Shows",
            description:
                "Get Spotify catalog information for several shows.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify show IDs (max 50)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_shows", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/shows",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_show_episodes",
        {
            title: "Get Show Episodes",
            description:
                "Get Spotify catalog information about a show's episodes.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the show."),
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
            withErrorHandling("get_show_episodes", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/shows/${args.id}/episodes`,
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
        "get_saved_shows",
        {
            title: "Get User's Saved Shows",
            description:
                "Get a list of shows saved in the current user's library.",
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
            withErrorHandling("get_saved_shows", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/shows",
                    query: {
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "save_shows",
        {
            title: "Save Shows for Current User",
            description:
                "Save one or more shows to the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify show IDs (max 50)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_shows", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/shows",
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_saved_shows",
        {
            title: "Remove Saved Shows",
            description:
                "Remove one or more shows from the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify show IDs (max 50)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_saved_shows", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: "/me/shows",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "check_saved_shows",
        {
            title: "Check User's Saved Shows",
            description:
                "Check if one or more shows are saved in the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify show IDs (max 50)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_saved_shows", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/shows/contains",
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );
}
