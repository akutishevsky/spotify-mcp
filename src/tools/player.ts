import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.ts";
import {
    withErrorHandling,
    READ_ANNOTATIONS,
    WRITE_ANNOTATIONS,
    toolResponse,
} from "./index.ts";

export function registerPlayerTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_playback_state",
        {
            title: "Get Playback State",
            description:
                "Get information about the user's current playback state, including track or episode, progress, and active device.",
            inputSchema: {
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
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
            withErrorHandling("get_playback_state", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/player",
                    query: {
                        market: args.market,
                        additional_types: args.additional_types,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "transfer_playback",
        {
            title: "Transfer Playback",
            description:
                "Transfer playback to a new device and optionally begin playback.",
            inputSchema: {
                device_ids: z
                    .string()
                    .describe(
                        "A JSON array containing the ID of the device to transfer to. Only a single device ID is currently supported."
                    ),
                play: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, playback starts on the new device. Default: false (keeps current playback state)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("transfer_playback", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/player",
                    body: {
                        device_ids: JSON.parse(args.device_ids),
                        play: args.play,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_available_devices",
        {
            title: "Get Available Devices",
            description:
                "Get information about the user's available Spotify Connect devices.",
            inputSchema: {},
            annotations: READ_ANNOTATIONS,
        },
        () =>
            withErrorHandling("get_available_devices", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/player/devices",
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_currently_playing",
        {
            title: "Get Currently Playing Track",
            description:
                "Get the object currently being played on the user's Spotify account.",
            inputSchema: {
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
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
            withErrorHandling("get_currently_playing", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/player/currently-playing",
                    query: {
                        market: args.market,
                        additional_types: args.additional_types,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "start_playback",
        {
            title: "Start/Resume Playback",
            description:
                "Start a new context or resume current playback on the user's active device. Requires Spotify Premium.",
            inputSchema: {
                device_id: z
                    .string()
                    .optional()
                    .describe(
                        "The ID of the device to target. If not provided, the user's currently active device is used."
                    ),
                context_uri: z
                    .string()
                    .optional()
                    .describe(
                        "Spotify URI of the context to play (album, artist, or playlist). Example: 'spotify:album:1Je1IMUlBXcx1Fz0WE7oPT'."
                    ),
                uris: z
                    .string()
                    .optional()
                    .describe(
                        "JSON array of Spotify track URIs to play. Example: '[\"spotify:track:4iV5W9uYEdYUVa79Axb7Rh\"]'."
                    ),
                offset: z
                    .string()
                    .optional()
                    .describe(
                        "JSON object indicating where in the context playback should start. Example: '{\"position\": 5}' or '{\"uri\": \"spotify:track:...\"}'."
                    ),
                position_ms: z
                    .number()
                    .optional()
                    .describe(
                        "Position in milliseconds to seek to. Passing a position for a track within the context starts playback at that position."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("start_playback", async () => {
                const body: Record<string, unknown> = {};
                if (args.context_uri)
                    body.context_uri = args.context_uri;
                if (args.uris) body.uris = JSON.parse(args.uris);
                if (args.offset) body.offset = JSON.parse(args.offset);
                if (args.position_ms !== undefined)
                    body.position_ms = args.position_ms;

                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/player/play",
                    query: { device_id: args.device_id },
                    body:
                        Object.keys(body).length > 0
                            ? body
                            : undefined,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "pause_playback",
        {
            title: "Pause Playback",
            description:
                "Pause playback on the user's account. Requires Spotify Premium.",
            inputSchema: {
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("pause_playback", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/player/pause",
                    query: { device_id: args.device_id },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "skip_to_next",
        {
            title: "Skip To Next",
            description:
                "Skips to next track in the user's queue. Requires Spotify Premium.",
            inputSchema: {
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("skip_to_next", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "POST",
                    path: "/me/player/next",
                    query: { device_id: args.device_id },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "skip_to_previous",
        {
            title: "Skip To Previous",
            description:
                "Skips to previous track in the user's queue. Requires Spotify Premium.",
            inputSchema: {
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("skip_to_previous", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "POST",
                    path: "/me/player/previous",
                    query: { device_id: args.device_id },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "seek_to_position",
        {
            title: "Seek To Position",
            description:
                "Seeks to the given position in the user's currently playing track. Requires Spotify Premium.",
            inputSchema: {
                position_ms: z
                    .number()
                    .describe(
                        "The position in milliseconds to seek to. Must be positive. Passing a position beyond the track length will skip to the next track."
                    ),
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("seek_to_position", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/player/seek",
                    query: {
                        position_ms: args.position_ms,
                        device_id: args.device_id,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "set_repeat_mode",
        {
            title: "Set Repeat Mode",
            description:
                "Set the repeat mode for the user's playback. Requires Spotify Premium.",
            inputSchema: {
                state: z
                    .string()
                    .describe(
                        "Repeat mode: 'track' (repeat current track), 'context' (repeat current context), 'off' (turn off repeat)."
                    ),
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("set_repeat_mode", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/player/repeat",
                    query: {
                        state: args.state,
                        device_id: args.device_id,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "set_playback_volume",
        {
            title: "Set Playback Volume",
            description:
                "Set the volume for the user's current playback device. Requires Spotify Premium.",
            inputSchema: {
                volume_percent: z
                    .number()
                    .describe(
                        "Volume level to set (0-100)."
                    ),
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("set_playback_volume", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/player/volume",
                    query: {
                        volume_percent: args.volume_percent,
                        device_id: args.device_id,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "toggle_shuffle",
        {
            title: "Toggle Playback Shuffle",
            description:
                "Toggle shuffle on or off for user's playback. Requires Spotify Premium.",
            inputSchema: {
                state: z
                    .boolean()
                    .describe("true to turn shuffle on, false to turn off."),
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("toggle_shuffle", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/player/shuffle",
                    query: {
                        state: args.state,
                        device_id: args.device_id,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_recently_played",
        {
            title: "Get Recently Played Tracks",
            description:
                "Get tracks from the current user's recently played tracks. Note: Currently doesn't support podcast episodes.",
            inputSchema: {
                limit: z
                    .number()
                    .optional()
                    .describe(
                        "Maximum number of items to return (1-50, default 20)."
                    ),
                after: z
                    .number()
                    .optional()
                    .describe(
                        "Unix timestamp in milliseconds. Returns items after this cursor position."
                    ),
                before: z
                    .number()
                    .optional()
                    .describe(
                        "Unix timestamp in milliseconds. Returns items before this cursor position."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_recently_played", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/player/recently-played",
                    query: {
                        limit: args.limit,
                        after: args.after,
                        before: args.before,
                    },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_queue",
        {
            title: "Get the User's Queue",
            description:
                "Get the list of objects that make up the user's queue.",
            inputSchema: {},
            annotations: READ_ANNOTATIONS,
        },
        () =>
            withErrorHandling("get_queue", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/player/queue",
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "add_to_queue",
        {
            title: "Add Item to Playback Queue",
            description:
                "Add an item to the end of the user's current playback queue. Requires Spotify Premium.",
            inputSchema: {
                uri: z
                    .string()
                    .describe(
                        "The URI of the item to add to the queue. Must be a track or episode URI. Example: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'."
                    ),
                device_id: z
                    .string()
                    .optional()
                    .describe("The ID of the device to target."),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("add_to_queue", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "POST",
                    path: "/me/player/queue",
                    query: {
                        uri: args.uri,
                        device_id: args.device_id,
                    },
                });
                return toolResponse(data);
            })
    );
}
