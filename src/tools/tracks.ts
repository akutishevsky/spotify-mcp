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

export function registerTrackTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_track",
        {
            title: "Get Track",
            description:
                "Get Spotify catalog information for a single track.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the track."),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_track", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/tracks/${args.id}`,
                    query: { market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_tracks",
        {
            title: "Get Several Tracks",
            description:
                "Get Spotify catalog information for multiple tracks.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 50)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_several_tracks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/tracks",
                    query: { ids: args.ids, market: args.market },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_saved_tracks",
        {
            title: "Get User's Saved Tracks",
            description:
                "Get a list of the songs saved in the current user's 'Your Music' library.",
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
            withErrorHandling("get_saved_tracks", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/tracks",
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
        "save_tracks",
        {
            title: "Save Tracks for Current User",
            description:
                "Save one or more tracks to the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 50)."
                    ),
            },
            annotations: WRITE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("save_tracks", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:track:${s.trim()}`)
                    .join(",");
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "PUT",
                    path: "/me/library",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "remove_saved_tracks",
        {
            title: "Remove Saved Tracks",
            description:
                "Remove one or more tracks from the current user's library. Pass Spotify track IDs (not URIs) — they will be converted automatically.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 40)."
                    ),
            },
            annotations: DELETE_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("remove_saved_tracks", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:track:${s.trim()}`)
                    .join(",");
                const data = await spotifyRequest(mcpAccessToken, {
                    method: "DELETE",
                    path: "/me/library",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "check_saved_tracks",
        {
            title: "Check User's Saved Tracks",
            description:
                "Check if one or more tracks are saved in the current user's library.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 50)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("check_saved_tracks", async () => {
                const uris = args.ids
                    .split(",")
                    .map((s) => `spotify:track:${s.trim()}`)
                    .join(",");
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/me/library/contains",
                    query: { uris },
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_audio_features",
        {
            title: "Get Track's Audio Features",
            description:
                "Get audio feature information for a single track. Audio features include danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, and tempo.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the track."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_audio_features", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/audio-features/${args.id}`,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_several_audio_features",
        {
            title: "Get Several Tracks' Audio Features",
            description:
                "Get audio features for multiple tracks.",
            inputSchema: {
                ids: z
                    .string()
                    .describe(
                        "Comma-separated list of Spotify track IDs (max 100)."
                    ),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling(
                "get_several_audio_features",
                async () => {
                    const data = await spotifyRequest(mcpAccessToken, {
                        path: "/audio-features",
                        query: { ids: args.ids },
                    });
                    return toolResponse(data);
                }
            )
    );

    server.registerTool(
        "get_audio_analysis",
        {
            title: "Get Track's Audio Analysis",
            description:
                "Get a low-level audio analysis for a track. The audio analysis describes the track's structure and musical content, including rhythm, pitch, and timbre.",
            inputSchema: {
                id: z.string().describe("The Spotify ID of the track."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_audio_analysis", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: `/audio-analysis/${args.id}`,
                });
                return toolResponse(data);
            })
    );

    server.registerTool(
        "get_recommendations",
        {
            title: "Get Recommendations",
            description:
                "Get track recommendations based on seed artists, tracks, and genres, with tunable attributes like danceability, energy, and tempo.",
            inputSchema: {
                seed_artists: z
                    .string()
                    .optional()
                    .describe(
                        "Comma-separated list of Spotify artist IDs (up to 5 total seeds)."
                    ),
                seed_genres: z
                    .string()
                    .optional()
                    .describe(
                        "Comma-separated list of genres (up to 5 total seeds). Use get_available_genre_seeds for valid values."
                    ),
                seed_tracks: z
                    .string()
                    .optional()
                    .describe(
                        "Comma-separated list of Spotify track IDs (up to 5 total seeds)."
                    ),
                limit: z
                    .number()
                    .optional()
                    .describe(
                        "Target number of recommendations (1-100, default 20)."
                    ),
                market: z
                    .string()
                    .optional()
                    .describe("An ISO 3166-1 alpha-2 country code."),
                min_acousticness: z.number().optional().describe("Min acousticness (0.0-1.0)."),
                max_acousticness: z.number().optional().describe("Max acousticness (0.0-1.0)."),
                target_acousticness: z.number().optional().describe("Target acousticness (0.0-1.0)."),
                min_danceability: z.number().optional().describe("Min danceability (0.0-1.0)."),
                max_danceability: z.number().optional().describe("Max danceability (0.0-1.0)."),
                target_danceability: z.number().optional().describe("Target danceability (0.0-1.0)."),
                min_energy: z.number().optional().describe("Min energy (0.0-1.0)."),
                max_energy: z.number().optional().describe("Max energy (0.0-1.0)."),
                target_energy: z.number().optional().describe("Target energy (0.0-1.0)."),
                min_instrumentalness: z.number().optional().describe("Min instrumentalness (0.0-1.0)."),
                max_instrumentalness: z.number().optional().describe("Max instrumentalness (0.0-1.0)."),
                target_instrumentalness: z.number().optional().describe("Target instrumentalness (0.0-1.0)."),
                min_liveness: z.number().optional().describe("Min liveness (0.0-1.0)."),
                max_liveness: z.number().optional().describe("Max liveness (0.0-1.0)."),
                target_liveness: z.number().optional().describe("Target liveness (0.0-1.0)."),
                min_popularity: z.number().optional().describe("Min popularity (0-100)."),
                max_popularity: z.number().optional().describe("Max popularity (0-100)."),
                target_popularity: z.number().optional().describe("Target popularity (0-100)."),
                min_speechiness: z.number().optional().describe("Min speechiness (0.0-1.0)."),
                max_speechiness: z.number().optional().describe("Max speechiness (0.0-1.0)."),
                target_speechiness: z.number().optional().describe("Target speechiness (0.0-1.0)."),
                min_tempo: z.number().optional().describe("Min tempo in BPM."),
                max_tempo: z.number().optional().describe("Max tempo in BPM."),
                target_tempo: z.number().optional().describe("Target tempo in BPM."),
                min_valence: z.number().optional().describe("Min valence/positivity (0.0-1.0)."),
                max_valence: z.number().optional().describe("Max valence/positivity (0.0-1.0)."),
                target_valence: z.number().optional().describe("Target valence/positivity (0.0-1.0)."),
            },
            annotations: READ_ANNOTATIONS,
        },
        (args) =>
            withErrorHandling("get_recommendations", async () => {
                const query: Record<string, string | number | boolean | undefined> = {
                    seed_artists: args.seed_artists,
                    seed_genres: args.seed_genres,
                    seed_tracks: args.seed_tracks,
                    limit: args.limit,
                    market: args.market,
                };

                // Add all tunable attributes
                const tunableKeys = [
                    "min_acousticness", "max_acousticness", "target_acousticness",
                    "min_danceability", "max_danceability", "target_danceability",
                    "min_energy", "max_energy", "target_energy",
                    "min_instrumentalness", "max_instrumentalness", "target_instrumentalness",
                    "min_liveness", "max_liveness", "target_liveness",
                    "min_popularity", "max_popularity", "target_popularity",
                    "min_speechiness", "max_speechiness", "target_speechiness",
                    "min_tempo", "max_tempo", "target_tempo",
                    "min_valence", "max_valence", "target_valence",
                ] as const;

                for (const key of tunableKeys) {
                    if (args[key] !== undefined) {
                        query[key] = args[key];
                    }
                }

                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/recommendations",
                    query,
                });
                return toolResponse(data);
            })
    );
}
