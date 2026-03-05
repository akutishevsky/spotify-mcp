import { tokenStore } from "../auth/token-store.js";
import { refreshSpotifyToken } from "../auth/oauth.js";
import { getOAuthConfig } from "../config.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger({ component: "spotify-api" });
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Refresh tokens if they expire within this buffer (5 minutes)
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

async function getAccessToken(mcpToken: string): Promise<string> {
    let tokenData = await tokenStore.getTokens(mcpToken);
    if (!tokenData) {
        throw new Error("Invalid or expired token");
    }

    const now = Date.now();
    const isExpiringSoon = tokenData.expiresAt - now < EXPIRY_BUFFER_MS;

    if (isExpiringSoon) {
        logger.info("Access token expired or expiring soon, refreshing");

        try {
            const config = getOAuthConfig();
            const refreshedTokens = await refreshSpotifyToken(
                tokenData.spotifyRefreshToken,
                config
            );

            await tokenStore.updateTokens(mcpToken, {
                spotifyAccessToken: refreshedTokens.accessToken,
                spotifyRefreshToken: refreshedTokens.refreshToken,
                expiresAt: now + refreshedTokens.expiresIn * 1000,
            });

            tokenData = await tokenStore.getTokens(mcpToken);
            if (!tokenData) {
                throw new Error("Failed to retrieve updated tokens");
            }

            logger.info("Token refresh successful");
        } catch (error) {
            logger.error("Token refresh failed", {
                error: String(error),
            });
            throw new Error(`Failed to refresh access token: ${error}`);
        }
    }

    return tokenData.spotifyAccessToken;
}

export interface SpotifyRequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    contentType?: string;
}

export async function spotifyRequest<T = unknown>(
    mcpToken: string,
    options: SpotifyRequestOptions
): Promise<T> {
    const accessToken = await getAccessToken(mcpToken);
    const { method = "GET", path, query, body, contentType } = options;

    // Build URL with query params
    const url = new URL(`${SPOTIFY_API_BASE}${path}`);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        }
    }

    // Build headers
    const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
    };

    if (contentType) {
        headers["Content-Type"] = contentType;
    } else if (body && typeof body !== "string") {
        headers["Content-Type"] = "application/json";
    }

    // Build fetch options
    const fetchOptions: RequestInit = { method, headers };
    if (body) {
        fetchOptions.body =
            typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(url.toString(), fetchOptions);

    // Handle no-content responses (204)
    if (response.status === 204) {
        return { success: true } as T;
    }

    // Handle error responses
    if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage: string;
        try {
            const errorJson = JSON.parse(errorBody);
            errorMessage =
                errorJson.error?.message ||
                errorJson.error_description ||
                errorBody;
        } catch {
            errorMessage = errorBody;
        }
        throw new Error(
            `Spotify API error (${response.status}): ${errorMessage}`
        );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
        return { success: true } as T;
    }

    return JSON.parse(text) as T;
}
