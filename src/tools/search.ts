import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.ts";
import { withErrorHandling, READ_ANNOTATIONS, toolResponse } from "./index.ts";

export function registerSearchTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "search",
        {
            title: "Search for Item",
            description:
                "Get Spotify catalog information about albums, artists, playlists, tracks, shows, episodes, or audiobooks that match a keyword string.",
            inputSchema: {
                q: z
                    .string()
                    .describe(
                        "Search query. You can narrow down results using field filters: album, artist, track, year, genre, tag (new, hipster). Example: 'remaster track:Doxy artist:Miles Davis'."
                    ),
                type: z
                    .string()
                    .describe(
                        "Comma-separated list of item types to search across: album, artist, playlist, track, show, episode, audiobook."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
                limit: z
                    .number()
                    .optional()
                    .describe(
                        "Maximum number of results per type (1-50, default 20)."
                    ),
                offset: z
                    .number()
                    .optional()
                    .describe(
                        "Index of the first result to return (default 0, max 1000)."
                    ),
                include_external: z
                    .string()
                    .optional()
                    .describe(
                        "If 'audio', includes externally hosted audio content."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("search", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/search",
                    query: {
                        q: args.q,
                        type: args.type,
                        market: args.market,
                        limit: args.limit,
                        offset: args.offset,
                        include_external: args.include_external,
                    },
                });
                return toolResponse(data);
            })
    );
}
