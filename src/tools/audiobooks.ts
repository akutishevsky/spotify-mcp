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

export function registerAudiobookTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_audiobook",
        {
            title: "Get an Audiobook",
            description:
                "Get Spotify catalog information for a single audiobook. Only available in US, UK, Canada, Ireland, New Zealand, and Australia.",
            inputSchema: {
                id: z
                    .string()
                    .describe("The Spotify ID of the audiobook."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_audiobook", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/audiobooks/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_audiobooks",
        {
            title: "Get Several Audiobooks",
            description:
                "Get Spotify catalog information for several audiobooks.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify audiobook IDs (max 50)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_audiobooks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/audiobooks",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_audiobook_chapters",
        {
            title: "Get Audiobook Chapters",
            description:
                "Get Spotify catalog information about an audiobook's chapters.",
            inputSchema: {
                id: z
                    .string()
                    .describe("The Spotify ID of the audiobook."),
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
            withErrorHandling("get_audiobook_chapters", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/audiobooks/${args.id}/chapters`,
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
        "get_saved_audiobooks",
        {
            title: "Get User's Saved Audiobooks",
            description:
                "Get a list of the audiobooks saved in the current user's library.",
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
            withErrorHandling("get_saved_audiobooks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/audiobooks",
                    query: {
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "save_audiobooks",
        {
            title: "Save Audiobooks for Current User",
            description:
                "Save one or more audiobooks to the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify audiobook IDs (max 50)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_audiobooks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/audiobooks",
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_saved_audiobooks",
        {
            title: "Remove Saved Audiobooks",
            description:
                "Remove one or more audiobooks from the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify audiobook IDs (max 50)."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_saved_audiobooks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: "/me/audiobooks",
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "check_saved_audiobooks",
        {
            title: "Check User's Saved Audiobooks",
            description:
                "Check if one or more audiobooks are saved in the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify audiobook IDs (max 50)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_saved_audiobooks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/audiobooks/contains",
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );
}
