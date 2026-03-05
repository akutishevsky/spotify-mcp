import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.js";
import { withErrorHandling, READ_ANNOTATIONS, toolResponse } from "./index.js";

export function registerChapterTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_chapter",
        {
            title: "Get a Chapter",
            description:
                "Get Spotify catalog information for a single audiobook chapter. Only available in US, UK, Canada, Ireland, New Zealand, and Australia.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the chapter."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_chapter", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/chapters/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_chapters",
        {
            title: "Get Several Chapters",
            description:
                "Get Spotify catalog information for several audiobook chapters.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify chapter IDs (max 50)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_chapters", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/chapters",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );
}
