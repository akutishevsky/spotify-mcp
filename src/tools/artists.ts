import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.ts";
import { withErrorHandling, READ_ANNOTATIONS, toolResponse } from "./index.ts";

export function registerArtistTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_artist",
        {
            title: "Get Artist",
            description:
                "Get Spotify catalog information for a single artist.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the artist."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_artist", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/artists/${args.id}`,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_artists",
        {
            title: "Get Several Artists",
            description:
                "Get Spotify catalog information for several artists based on their Spotify IDs.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify artist IDs (max 50)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_artists", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/artists",
                    query: { ids: args.ids },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_artist_albums",
        {
            title: "Get Artist's Albums",
            description:
                "Get Spotify catalog information about an artist's albums.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the artist."),
                include_groups: z
                    .string()
                    .optional()
                    .describe(
                        "Comma-separated list of album types: album, single, appears_on, compilation."
                    ),
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
            withErrorHandling("get_artist_albums", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/artists/${args.id}/albums`,
                    query: {
                        include_groups: args.include_groups,
                        market: args.market,
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_artist_top_tracks",
        {
            title: "Get Artist's Top Tracks",
            description:
                "Get Spotify catalog information about an artist's top tracks by country.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the artist."),
                market: z
                    .string()
                    .optional()
                    .describe(
                        "An ISO 3166-1 alpha-2 country code. If not specified, uses the user's account country."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_artist_top_tracks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/artists/${args.id}/top-tracks`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_artist_related_artists",
        {
            title: "Get Artist's Related Artists",
            description:
                "Get Spotify catalog information about artists similar to a given artist.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the artist."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_artist_related_artists", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/artists/${args.id}/related-artists`,
                });
                return toolResponse(data);
            })
    );
}
