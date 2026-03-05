import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.js";
import {
    withErrorHandling,
    READ_ANNOTATIONS,
    WRITE_ANNOTATIONS,
    DELETE_ANNOTATIONS,
    toolResponse,
} from "./index.js";

export function registerEpisodeTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_episode",
        {
            title: "Get Episode",
            description:
                "Get Spotify catalog information for a single episode.",
            inputSchema: {
                id: z
                    .string()
                    .describe("The Spotify ID of the episode."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_episode", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/episodes/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_episodes",
        {
            title: "Get Several Episodes",
            description:
                "Get Spotify catalog information for several episodes.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify episode IDs (max 50)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_episodes", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/episodes",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_saved_episodes",
        {
            title: "Get User's Saved Episodes",
            description:
                "Get a list of the episodes saved in the current user's library.",
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
            withErrorHandling("get_saved_episodes", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/episodes",
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
        "save_episodes",
        {
            title: "Save Episodes for Current User",
            description:
                "Save one or more episodes to the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify episode IDs (max 50)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_episodes", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/episodes",
                    body: { ids: args.ids.split(",").map((s) => s.trim()) },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_saved_episodes",
        {
            title: "Remove Saved Episodes",
            description:
                "Remove one or more episodes from the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify episode IDs (max 50)."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_saved_episodes", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: "/me/episodes",
                    body: { ids: args.ids.split(",").map((s) => s.trim()) },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "check_saved_episodes",
        {
            title: "Check User's Saved Episodes",
            description:
                "Check if one or more episodes are saved in the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify episode IDs (max 50)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_saved_episodes", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/episodes/contains",
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );
}
