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

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function toSpotifyUris(ids: string, type: string): string {
    return ids
        .split(",")
        .map((s) => `spotify:${type}:${s.trim()}`)
        .join(",");
}

interface GetToolConfig {
    entity: string;
    plural: string;
    title?: string;
    description?: string;
    marketDescription?: string;
}

export function registerGetTool(
    server: McpServer,
    mcpAccessToken: string,
    config: GetToolConfig
) {
    const { entity, plural } = config;
    const title = config.title ?? `Get ${capitalize(entity)}`;
    const description =
        config.description ??
        `Get Spotify catalog information for a single ${entity}.`;
    const marketDesc =
        config.marketDescription ?? "An ISO 3166-1 alpha-2 country code.";

    server.registerTool(
        `get_${entity}`,
        {
            title,
            description,
            inputSchema: {
                id: z.string().describe(`The Spotify ID of the ${entity}.`),
                market: z.string().optional().describe(marketDesc),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(`get_${entity}`, async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/${plural}/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );
}

interface GetSeveralToolConfig {
    entity: string;
    plural: string;
    maxIds?: number;
    description?: string;
}

export function registerGetSeveralTool(
    server: McpServer,
    mcpAccessToken: string,
    config: GetSeveralToolConfig
) {
    const { entity, plural } = config;
    const maxIds = config.maxIds ?? 50;
    const description =
        config.description ??
        `Get Spotify catalog information for several ${plural}.`;

    server.registerTool(
        `get_several_${plural}`,
        {
            title: `Get Several ${capitalize(plural)}`,
            description,
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        `Comma-separated list of Spotify ${entity} IDs (max ${maxIds}).`
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(`get_several_${plural}`, async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/${plural}`,
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );
}

interface ChildrenToolConfig {
    entity: string;
    plural: string;
    children: string;
}

export function registerChildrenTool(
    server: McpServer,
    mcpAccessToken: string,
    config: ChildrenToolConfig
) {
    const { entity, plural, children } = config;
    const toolName = `get_${entity}_${children}`;

    server.registerTool(
        toolName,
        {
            title: `Get ${capitalize(entity)} ${capitalize(children)}`,
            description: `Get Spotify catalog information about a ${entity}'s ${children}.`,
            inputSchema: {
                id: z.string().describe(`The Spotify ID of the ${entity}.`),
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
            withErrorHandling(toolName, async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/${plural}/${args.id}/${children}`,
                    query: {
                        market: args.market,
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );
}

interface LibraryToolsConfig {
    entity: string;
    plural: string;
    maxIds?: number;
    getSavedDescription?: string;
    getSavedHasMarket?: boolean;
    saveDescription?: string;
    removeDescription?: string;
    removeHasMarket?: boolean;
    removeMaxIds?: number;
    checkDescription?: string;
}

export function registerLibraryTools(
    server: McpServer,
    mcpAccessToken: string,
    config: LibraryToolsConfig
) {
    const { entity, plural } = config;
    const maxIds = config.maxIds ?? 50;

    // Get Saved
    const getSavedDescription =
        config.getSavedDescription ??
        `Get a list of ${plural} saved in the current user's library.`;
    const getSavedSchema: Record<string, z.ZodTypeAny> = {};
    if (config.getSavedHasMarket) {
        getSavedSchema.market = z
            .string()
            .optional()
            .describe("An ISO 3166-1 alpha-2 country code.");
    }
    getSavedSchema.limit = z
        .number()
        .optional()
        .describe("Maximum number of items to return (1-50, default 20).");
    getSavedSchema.offset = z
        .number()
        .optional()
        .describe("Index of the first item to return (default 0).");

    server.registerTool(
        `get_saved_${plural}`,
        {
            title: `Get User's Saved ${capitalize(plural)}`,
            description: getSavedDescription,
            inputSchema: getSavedSchema,
            annotations: READ_ANNOTATIONS,
        },
        (args: Record<string, unknown>) =>
            withErrorHandling(`get_saved_${plural}`, async () => {
                const query: Record<string, string | number | boolean | undefined> = {
                    limit: args.limit as number | undefined,
                    offset: args.offset as number | undefined,
                };
                if (config.getSavedHasMarket) query.market = args.market as string | undefined;
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/me/${plural}`,
                    query,
                });
                return toolResponse(data);
            })
    );

    // Save
    const saveDescription =
        config.saveDescription ??
        `Save one or more ${plural} to the current user's library.`;

    server.registerTool(
        `save_${plural}`,
        {
            title: `Save ${capitalize(plural)} for Current User`,
            description: saveDescription,
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        `Comma-separated list of Spotify ${entity} IDs (max ${maxIds}).`
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(`save_${plural}`, async () => {
                const uris = toSpotifyUris(args.ids, entity);
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/library",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    // Remove
    const removeMaxIds = config.removeMaxIds ?? maxIds;
    const removeDescription =
        config.removeDescription ??
        `Remove one or more ${plural} from the current user's library.`;
    const removeSchema: Record<string, z.ZodTypeAny> = {
        ids: z
            .string()
            .describe(
                `Comma-separated list of Spotify ${entity} IDs (max ${removeMaxIds}).`
            ),
    };
    if (config.removeHasMarket) {
        removeSchema.market = z
            .string()
            .optional()
            .describe("An ISO 3166-1 alpha-2 country code.");
    }

    server.registerTool(
        `remove_saved_${plural}`,
        {
            title: `Remove Saved ${capitalize(plural)}`,
            description: removeDescription,
            inputSchema: removeSchema,
            annotations: DELETE_ANNOTATIONS,
        },
        (args: Record<string, unknown>) =>
            withErrorHandling(`remove_saved_${plural}`, async () => {
                const uris = toSpotifyUris(args.ids as string, entity);
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: "/me/library",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    // Check
    const checkDescription =
        config.checkDescription ??
        `Check if one or more ${plural} are saved in the current user's library.`;

    server.registerTool(
        `check_saved_${plural}`,
        {
            title: `Check User's Saved ${capitalize(plural)}`,
            description: checkDescription,
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        `Comma-separated list of Spotify ${entity} IDs (max ${maxIds}).`
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(`check_saved_${plural}`, async () => {
                const uris = toSpotifyUris(args.ids, entity);
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/library/contains",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );
}
