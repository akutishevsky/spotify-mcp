import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.ts";
import { withErrorHandling, READ_ANNOTATIONS, toolResponse } from "./index.ts";

export function registerCategoryTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_browse_categories",
        {
            title: "Get Several Browse Categories",
            description:
                "Get a list of categories used to tag items in Spotify.",
            inputSchema: {
                locale: z
                    .string()
                    .optional()
                    .describe(
                        "The desired language, consisting of an ISO 639-1 language code and an ISO 3166-1 alpha-2 country code (e.g. 'es_MX')."
                    ),
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
            withErrorHandling("get_browse_categories", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/browse/categories",
                    query: {
                        locale: args.locale,
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_browse_category",
        {
            title: "Get Single Browse Category",
            description:
                "Get a single category used to tag items in Spotify.",
            inputSchema: {
                category_id: z
                    .string()
                    .describe("The Spotify category ID."),
                locale: z
                    .string()
                    .optional()
                    .describe(
                        "The desired language (e.g. 'es_MX')."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_browse_category", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/browse/categories/${args.category_id}`,
                    query: { locale: args.locale },
                });
                return toolResponse(data);
            })
    );
}
