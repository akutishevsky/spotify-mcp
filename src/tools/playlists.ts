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

export function registerPlaylistTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_playlist",
        {
            title: "Get Playlist",
            description:
                "Get a playlist owned by a Spotify user.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
                fields: z
                    .string()
                    .optional()
                    .describe(
                        "Filters for the query. A comma-separated list of the fields to return. Example: 'items(added_by.id,track(name,href,album(name,href)))'."
                    ),
                additional_types: z
                    .string()
                    .optional()
                    .describe(
                        "Comma-separated list of item types: 'track', 'episode'."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_playlist", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/playlists/${args.playlist_id}`,
                    query: {
                        market: args.market,
                        fields: args.fields,
                        additional_types: args.additional_types,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "change_playlist_details",
        {
            title: "Change Playlist Details",
            description:
                "Change a playlist's name and public/private state. The user must own the playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                name: z
                    .string()
                    .optional()
                    .describe("The new name for the playlist."),
                public: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, the playlist will be public. If false, it will be private."
                    ),
                collaborative: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, the playlist will become collaborative. Note: a playlist can't be both collaborative and public."
                    ),
                description: z
                    .string()
                    .optional()
                    .describe(
                        "Value for playlist description."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("change_playlist_details", async () => {
                const body: Record<string, unknown> = {};
                if (args.name !== undefined) body.name = args.name;
                if (args.public !== undefined) body.public = args.public;
                if (args.collaborative !== undefined)
                    body.collaborative = args.collaborative;
                if (args.description !== undefined)
                    body.description = args.description;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: `/playlists/${args.playlist_id}`,
                    body,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_playlist_items",
        {
            title: "Get Playlist Items",
            description:
                "Get full details of the items of a playlist owned by a Spotify user.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
                fields: z
                    .string()
                    .optional()
                    .describe(
                        "Filters for the query."
                    ),
                limit: z
                    .number()
                    .optional()
                    .describe(
                        "Maximum number of items to return (1-100, default 20)."
                    ),
                offset: z
                    .number()
                    .optional()
                    .describe(
                        "Index of the first item to return (default 0)."
                    ),
                additional_types: z
                    .string()
                    .optional()
                    .describe(
                        "Comma-separated list of item types: 'track', 'episode'."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_playlist_items", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/playlists/${args.playlist_id}/tracks`,
                    query: {
                        market: args.market,
                        fields: args.fields,
                        limit: args.limit,
                        offset: args.offset,
                        additional_types: args.additional_types,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "update_playlist_items",
        {
            title: "Update Playlist Items",
            description:
                "Reorder or replace items in a playlist. The user must own the playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                uris: z
                    .string()
                    .optional()
                    .describe(
                        "JSON array of Spotify track/episode URIs to set as the playlist content. Replaces all items."
                    ),
                range_start: z
                    .number()
                    .optional()
                    .describe(
                        "The position of the first item to be reordered."
                    ),
                insert_before: z
                    .number()
                    .optional()
                    .describe(
                        "The position where the items should be inserted."
                    ),
                range_length: z
                    .number()
                    .optional()
                    .describe(
                        "The amount of items to be reordered (default 1)."
                    ),
                snapshot_id: z
                    .string()
                    .optional()
                    .describe(
                        "The playlist's snapshot ID against which you want to make the changes."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("update_playlist_items", async () => {
                const body: Record<string, unknown> = {};
                if (args.uris) body.uris = JSON.parse(args.uris);
                if (args.range_start !== undefined)
                    body.range_start = args.range_start;
                if (args.insert_before !== undefined)
                    body.insert_before = args.insert_before;
                if (args.range_length !== undefined)
                    body.range_length = args.range_length;
                if (args.snapshot_id)
                    body.snapshot_id = args.snapshot_id;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: `/playlists/${args.playlist_id}/tracks`,
                    body,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "add_items_to_playlist",
        {
            title: "Add Items to Playlist",
            description:
                "Add one or more items to a user's playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                uris: z
                    .string()
                    .describe(
                        "JSON array of Spotify URIs to add. Example: '[\"spotify:track:4iV5W9uYEdYUVa79Axb7Rh\"]'. Max 100 items."
                    ),
                position: z
                    .number()
                    .optional()
                    .describe(
                        "Position to insert the items (0-based). If omitted, items are appended."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("add_items_to_playlist", async () => {
                const body: Record<string, unknown> = {
                    uris: JSON.parse(args.uris),
                };
                if (args.position !== undefined)
                    body.position = args.position;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "POST",
                    path: `/playlists/${args.playlist_id}/tracks`,
                    body,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_playlist_items",
        {
            title: "Remove Playlist Items",
            description:
                "Remove one or more items from a user's playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                tracks: z
                    .string()
                    .describe(
                        "JSON array of objects with 'uri' field identifying tracks/episodes to remove. Example: '[{\"uri\": \"spotify:track:4iV5W9uYEdYUVa79Axb7Rh\"}]'."
                    ),
                snapshot_id: z
                    .string()
                    .optional()
                    .describe(
                        "The playlist's snapshot ID."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_playlist_items", async () => {
                const body: Record<string, unknown> = {
                    tracks: JSON.parse(args.tracks),
                };
                if (args.snapshot_id)
                    body.snapshot_id = args.snapshot_id;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: `/playlists/${args.playlist_id}/tracks`,
                    body,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_current_user_playlists",
        {
            title: "Get Current User's Playlists",
            description:
                "Get a list of the playlists owned or followed by the current Spotify user.",
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
            withErrorHandling(
                "get_current_user_playlists",
                async () => {
                    const data = await spotifyRequest(mcpAccessToken, {
                        path: "/me/playlists",
                        query: {
                            limit: args.limit,
                            offset: args.offset,
                        },
                    });
                    return toolResponse(data);
                }
            )
    );

    server.registerTool(
        "get_user_playlists",
        {
            title: "Get User's Playlists",
            description:
                "Get a list of the playlists owned or followed by a Spotify user.",
            inputSchema: {
                user_id: z
                    .string()
                    .describe("The user's Spotify user ID."),
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
            withErrorHandling("get_user_playlists", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/users/${args.user_id}/playlists`,
                    query: {
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "create_playlist",
        {
            title: "Create Playlist",
            description:
                "Create a playlist for the current user.",
            inputSchema: {
                name: z.string().describe("The name for the new playlist."),
                public: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, the playlist will be public (default true)."
                    ),
                collaborative: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, the playlist will be collaborative (default false)."
                    ),
                description: z
                    .string()
                    .optional()
                    .describe("Value for playlist description."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("create_playlist", async () => {
                // First get current user ID
                const me = await spotifyRequest<{ id: string }>(
                    mcpAccessToken,
                    { path: "/me" }
                );

                const body: Record<string, unknown> = {
                    name: args.name,
                };
                if (args.public !== undefined) body.public = args.public;
                if (args.collaborative !== undefined)
                    body.collaborative = args.collaborative;
                if (args.description !== undefined)
                    body.description = args.description;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "POST",
                    path: `/users/${me.id}/playlists`,
                    body,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "create_playlist_for_user",
        {
            title: "Create Playlist for User",
            description:
                "Create a playlist for a specific Spotify user. The playlist will be empty until you add tracks.",
            inputSchema: {
                user_id: z
                    .string()
                    .describe("The user's Spotify user ID."),
                name: z.string().describe("The name for the new playlist."),
                public: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, the playlist will be public (default true)."
                    ),
                collaborative: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, the playlist will be collaborative (default false)."
                    ),
                description: z
                    .string()
                    .optional()
                    .describe("Value for playlist description."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("create_playlist_for_user", async () => {
                const body: Record<string, unknown> = {
                    name: args.name,
                };
                if (args.public !== undefined) body.public = args.public;
                if (args.collaborative !== undefined)
                    body.collaborative = args.collaborative;
                if (args.description !== undefined)
                    body.description = args.description;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "POST",
                    path: `/users/${args.user_id}/playlists`,
                    body,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_featured_playlists",
        {
            title: "Get Featured Playlists",
            description:
                "Get a list of Spotify featured playlists.",
            inputSchema: {
                locale: z
                    .string()
                    .optional()
                    .describe(
                        "The desired language (e.g. 'es_MX')."
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
            withErrorHandling("get_featured_playlists", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/browse/featured-playlists",
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
        "get_category_playlists",
        {
            title: "Get Category's Playlists",
            description:
                "Get a list of Spotify playlists tagged with a particular category.",
            inputSchema: {
                category_id: z
                    .string()
                    .describe("The Spotify category ID."),
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
            withErrorHandling("get_category_playlists", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/browse/categories/${args.category_id}/playlists`,
                    query: {
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_playlist_cover_image",
        {
            title: "Get Playlist Cover Image",
            description:
                "Get the current image associated with a specific playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_playlist_cover_image", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/playlists/${args.playlist_id}/images`,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "upload_playlist_cover_image",
        {
            title: "Add Custom Playlist Cover Image",
            description:
                "Replace the image used to represent a specific playlist. Image must be a Base64-encoded JPEG, max 256 KB.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                image: z
                    .string()
                    .describe(
                        "Base64-encoded JPEG image data (max 256 KB)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(
                "upload_playlist_cover_image",
                async () => {
                    const data = await spotifyRequest(mcpAccessToken, {
                        method: "PUT",
                        path: `/playlists/${args.playlist_id}/images`,
                        body: args.image,
                        contentType: "image/jpeg",
                    });
                    return toolResponse(data);
                }
            )
    );
}
