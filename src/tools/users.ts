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

export function registerUserTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_current_user_profile",
        {
            title: "Get Current User's Profile",
            description:
                "Get detailed profile information about the current user.",
            inputSchema: {},
            annotations: READ_ANNOTATIONS,
        },
        () =>
            withErrorHandling("get_current_user_profile", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me",
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_user_top_items",
        {
            title: "Get User's Top Items",
            description:
                "Get the current user's top artists or tracks based on calculated affinity.",
            inputSchema: {
                type: z
                    .string()
                    .describe(
                        "The type of entity to return: 'artists' or 'tracks'."
                    ),
                time_range: z
                    .string()
                    .optional()
                    .describe(
                        "Time range: 'short_term' (last 4 weeks), 'medium_term' (last 6 months, default), 'long_term' (all time)."
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
            withErrorHandling("get_user_top_items", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/me/top/${args.type}`,
                    query: {
                        time_range: args.time_range,
                        limit: args.limit,
                        offset: args.offset,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_user_profile",
        {
            title: "Get User's Profile",
            description:
                "Get public profile information about a Spotify user.",
            inputSchema: {
                user_id: z
                    .string()
                    .describe("The user's Spotify user ID."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_user_profile", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/users/${args.user_id}`,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "follow_playlist",
        {
            title: "Follow Playlist",
            description:
                "Add the current user as a follower of a playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
                public: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, the playlist will be included in the user's public playlists (default true)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("follow_playlist", async () => {
                const body: Record<string, unknown> = {};
                if (args.public !== undefined) body.public = args.public;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: `/playlists/${args.playlist_id}/followers`,
                    body:
                        Object.keys(body).length > 0
                            ? body
                            : undefined,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "unfollow_playlist",
        {
            title: "Unfollow Playlist",
            description:
                "Remove the current user as a follower of a playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("unfollow_playlist", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: `/playlists/${args.playlist_id}/followers`,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_followed_artists",
        {
            title: "Get Followed Artists",
            description:
                "Get the current user's followed artists.",
            inputSchema: {
                type: z
                    .string()
                    .optional()
                    .describe(
                        "The ID type: currently only 'artist' is supported."
                    ),
                after: z
                    .string()
                    .optional()
                    .describe(
                        "The last artist ID retrieved from the previous request (cursor-based pagination)."
                    ),
                limit: z
                    .number()
                    .optional()
                    .describe(
                        "Maximum number of items to return (1-50, default 20)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_followed_artists", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/following",
                    query: {
                        type: args.type || "artist",
                        after: args.after,
                        limit: args.limit,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "follow_artists_or_users",
        {
            title: "Follow Artists or Users",
            description:
                "Add the current user as a follower of one or more artists or other Spotify users.",
            inputSchema: {
                type: z
                    .string()
                    .describe(
                        "The ID type: 'artist' or 'user'."
                    ),
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify IDs (max 50)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("follow_artists_or_users", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/following",
                    query: { type: args.type },
                    body: { ids: args.ids.split(",").map((s) => s.trim()) },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "unfollow_artists_or_users",
        {
            title: "Unfollow Artists or Users",
            description:
                "Remove the current user as a follower of one or more artists or other Spotify users.",
            inputSchema: {
                type: z
                    .string()
                    .describe(
                        "The ID type: 'artist' or 'user'."
                    ),
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify IDs (max 50)."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(
                "unfollow_artists_or_users",
                async () => {
                    const data = await spotifyRequest(mcpAccessToken, {
                        method: "DELETE",
                        path: "/me/following",
                        query: { type: args.type },
                        body: {
                            ids: args.ids
                                .split(",")
                                .map((s) => s.trim()),
                        },
                    });
                    return toolResponse(data);
                }
            )
    );

    server.registerTool(
        "check_following_artists_or_users",
        {
            title: "Check If User Follows Artists or Users",
            description:
                "Check to see if the current user is following one or more artists or other Spotify users.",
            inputSchema: {
                type: z
                    .string()
                    .describe(
                        "The ID type: 'artist' or 'user'."
                    ),
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify IDs (max 50)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(
                "check_following_artists_or_users",
                async () => {
                    const data = await spotifyRequest(mcpAccessToken, {
                        path: "/me/following/contains",
                        query: {
                            type: args.type,
                            ids: args.ids,
                        },
                    });
                    return toolResponse(data);
                }
            )
    );

    server.registerTool(
        "check_following_playlist",
        {
            title: "Check if Current User Follows Playlist",
            description:
                "Check to see if the current user is following a specified playlist.",
            inputSchema: {
                playlist_id: z
                    .string()
                    .describe("The Spotify ID of the playlist."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(
                "check_following_playlist",
                async () => {
                    const data = await spotifyRequest(mcpAccessToken, {
                        path: `/playlists/${args.playlist_id}/followers/contains`,
                    });
                    return toolResponse(data);
                }
            )
    );
}
