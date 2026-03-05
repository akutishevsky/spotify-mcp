import { Hono } from "hono";
import { tokenStore } from "./token-store.ts";
import { getSupabaseClient } from "../db/supabase.ts";
import { createLogger } from "../utils/logger.ts";
import { encrypt, decrypt } from "../utils/encryption.ts";
import type { OAuthConfig } from "../config.ts";

const logger = createLogger({ component: "oauth" });

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

// All Spotify scopes needed for full Web API coverage
const SPOTIFY_SCOPES = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-read",
    "user-library-modify",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
    "user-read-playback-position",
    "user-top-read",
    "user-follow-read",
    "user-follow-modify",
    "streaming",
    "ugc-image-upload",
].join(" ");

interface OAuthSession {
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    redirectUri: string;
    clientId?: string;
}

interface OAuthSessionRow {
    session_id: string;
    state: string;
    code_challenge: string | null;
    code_challenge_method: string | null;
    redirect_uri: string;
    client_id: string | null;
}

interface AuthCode {
    spotifyCode: string;
    clientId?: string;
    redirectUri: string;
    codeChallenge?: string;
}

interface AuthCodeRow {
    code: string;
    spotify_code: string;
    client_id: string | null;
    redirect_uri: string;
    code_challenge: string | null;
}

interface RegisteredClientRow {
    client_id: string;
    client_secret: string | null;
    redirect_uris: string[];
}

class OAuthStore {
    async init(): Promise<void> {}

    async storeSession(
        sessionId: string,
        session: OAuthSession
    ): Promise<void> {
        const supabase = getSupabaseClient();
        const expiresAt = new Date(
            Date.now() + SESSION_TTL_MS
        ).toISOString();

        const { error } = await supabase.from("oauth_sessions").insert({
            session_id: sessionId,
            state: session.state,
            code_challenge: session.codeChallenge || null,
            code_challenge_method: session.codeChallengeMethod || null,
            redirect_uri: session.redirectUri,
            client_id: session.clientId || null,
            expires_at: expiresAt,
        });

        if (error) {
            throw new Error(
                `Failed to store OAuth session: ${error.message}`
            );
        }
    }

    async getSession(sessionId: string): Promise<OAuthSession | null> {
        const supabase = getSupabaseClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from("oauth_sessions")
            .select("*")
            .eq("session_id", sessionId)
            .gt("expires_at", now)
            .single();

        if (error || !data) return null;

        const row = data as OAuthSessionRow;
        return {
            state: row.state,
            codeChallenge: row.code_challenge || undefined,
            codeChallengeMethod: row.code_challenge_method || undefined,
            redirectUri: row.redirect_uri,
            clientId: row.client_id || undefined,
        };
    }

    async deleteSession(sessionId: string): Promise<void> {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from("oauth_sessions")
            .delete()
            .eq("session_id", sessionId);

        if (error) {
            throw new Error(
                `Failed to delete OAuth session: ${error.message}`
            );
        }
    }

    async storeAuthCode(code: string, data: AuthCode): Promise<void> {
        const supabase = getSupabaseClient();
        const expiresAt = new Date(
            Date.now() + SESSION_TTL_MS
        ).toISOString();

        const { error } = await supabase.from("auth_codes").insert({
            code,
            spotify_code: encrypt(data.spotifyCode),
            client_id: data.clientId || null,
            redirect_uri: data.redirectUri,
            code_challenge: data.codeChallenge || null,
            expires_at: expiresAt,
        });

        if (error) {
            throw new Error(`Failed to store auth code: ${error.message}`);
        }
    }

    async consumeAuthCode(code: string): Promise<AuthCode | null> {
        const supabase = getSupabaseClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from("auth_codes")
            .delete()
            .eq("code", code)
            .gt("expires_at", now)
            .select()
            .single();

        if (error || !data) return null;

        const row = data as AuthCodeRow;
        return {
            spotifyCode: decrypt(row.spotify_code),
            clientId: row.client_id || undefined,
            redirectUri: row.redirect_uri,
            codeChallenge: row.code_challenge || undefined,
        };
    }

    async registerClient(
        clientId: string,
        redirectUris: string[]
    ): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase.from("registered_clients").upsert(
            {
                client_id: clientId,
                client_secret: null,
                redirect_uris: redirectUris,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "client_id" }
        );

        if (error) {
            throw new Error(
                `Failed to register client: ${error.message}`
            );
        }
    }

    async getClient(
        clientId: string
    ): Promise<{ clientId: string; redirectUris: string[] } | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from("registered_clients")
            .select("*")
            .eq("client_id", clientId)
            .single();

        if (error || !data) return null;

        const row = data as RegisteredClientRow;
        return {
            clientId: row.client_id,
            redirectUris: row.redirect_uris,
        };
    }
}

const oauthStore = new OAuthStore();

function base64URLEncode(buffer: Buffer): string {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function sha256(input: string): Buffer {
    return Buffer.from(
        new Bun.CryptoHasher("sha256").update(input).digest()
    );
}

export async function initOAuthStore() {
    await oauthStore.init();
}

export function createOAuthRouter(config: OAuthConfig) {
    const oauth = new Hono();

    // Dynamic client registration
    oauth.post("/register", async (c) => {
        const body = await c.req.json();
        const clientId = crypto.randomUUID();

        await oauthStore.registerClient(
            clientId,
            body.redirect_uris || []
        );

        logger.info("OAuth client registered");

        return c.json({
            client_id: clientId,
            redirect_uris: body.redirect_uris || [],
        });
    });

    // Authorization endpoint
    oauth.get("/authorize", async (c) => {
        const responseType = c.req.query("response_type");
        const clientId = c.req.query("client_id");
        const redirectUri = c.req.query("redirect_uri");
        const state = c.req.query("state");
        const codeChallenge = c.req.query("code_challenge");
        const codeChallengeMethod = c.req.query("code_challenge_method");

        if (responseType !== "code") {
            return c.json(
                { error: "unsupported_response_type" },
                400
            );
        }

        if (!redirectUri) {
            return c.json(
                {
                    error: "invalid_request",
                    error_description: "redirect_uri is required",
                },
                400
            );
        }

        if (!state) {
            return c.json(
                {
                    error: "invalid_request",
                    error_description:
                        "state parameter is required for CSRF protection",
                },
                400
            );
        }

        if (!clientId) {
            return c.json(
                {
                    error: "invalid_request",
                    error_description: "client_id is required",
                },
                400
            );
        }

        const registeredClient = await oauthStore.getClient(clientId);
        if (!registeredClient) {
            return c.json(
                {
                    error: "invalid_client",
                    error_description: "client_id is not registered",
                },
                400
            );
        }

        if (!registeredClient.redirectUris.includes(redirectUri)) {
            return c.json(
                {
                    error: "invalid_request",
                    error_description:
                        "redirect_uri is not registered for this client",
                },
                400
            );
        }

        logger.info("Starting OAuth authorization flow");

        const internalState = crypto.randomUUID();

        await oauthStore.storeSession(internalState, {
            state,
            codeChallenge,
            codeChallengeMethod,
            redirectUri,
            clientId,
        });

        const spotifyAuthUrl = new URL(SPOTIFY_AUTH_URL);
        spotifyAuthUrl.searchParams.append("response_type", "code");
        spotifyAuthUrl.searchParams.append("client_id", config.clientId);
        spotifyAuthUrl.searchParams.append(
            "redirect_uri",
            config.redirectUri
        );
        spotifyAuthUrl.searchParams.append("scope", SPOTIFY_SCOPES);
        spotifyAuthUrl.searchParams.append("state", internalState);
        spotifyAuthUrl.searchParams.append("show_dialog", "true");

        return c.redirect(spotifyAuthUrl.toString());
    });

    // Callback from Spotify
    oauth.get("/callback", async (c) => {
        const code = c.req.query("code");
        const internalState = c.req.query("state");
        const error = c.req.query("error");

        if (error) {
            logger.warn("OAuth callback received error from Spotify", {
                error,
            });
            return c.json(
                { error: "access_denied", error_description: error },
                400
            );
        }

        if (!code || !internalState) {
            return c.json({ error: "invalid_request" }, 400);
        }

        const session = await oauthStore.getSession(internalState);
        if (!session) {
            return c.json({ error: "invalid_state" }, 400);
        }

        logger.info("Processing OAuth callback from Spotify");

        const authCode = crypto.randomUUID();

        await oauthStore.storeAuthCode(authCode, {
            spotifyCode: code,
            clientId: session.clientId,
            redirectUri: session.redirectUri,
            codeChallenge: session.codeChallenge,
        });

        await oauthStore.deleteSession(internalState);

        const redirectUrl = new URL(session.redirectUri);
        redirectUrl.searchParams.append("code", authCode);
        redirectUrl.searchParams.append("state", session.state);

        return c.redirect(redirectUrl.toString());
    });

    // Token endpoint
    oauth.post("/token", async (c) => {
        const body = await c.req.parseBody();
        const grantType = body.grant_type as string;
        const code = body.code as string;
        const codeVerifier = body.code_verifier as string;
        const redirectUri = body.redirect_uri as string;

        if (grantType !== "authorization_code") {
            return c.json({ error: "unsupported_grant_type" }, 400);
        }

        const authCodeData = await oauthStore.consumeAuthCode(code);
        if (!authCodeData) {
            return c.json({ error: "invalid_grant" }, 400);
        }

        logger.info("Processing token exchange request");

        if (redirectUri !== authCodeData.redirectUri) {
            return c.json(
                {
                    error: "invalid_grant",
                    error_description:
                        "redirect_uri does not match authorization request",
                },
                400
            );
        }

        // Validate PKCE
        if (authCodeData.codeChallenge) {
            if (!codeVerifier) {
                return c.json(
                    {
                        error: "invalid_request",
                        error_description: "code_verifier required",
                    },
                    400
                );
            }

            const hash = base64URLEncode(sha256(codeVerifier));
            if (hash !== authCodeData.codeChallenge) {
                return c.json(
                    {
                        error: "invalid_grant",
                        error_description: "invalid code_verifier",
                    },
                    400
                );
            }
        }

        try {
            // Exchange Spotify code for access token
            const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: authCodeData.spotifyCode,
                    redirect_uri: config.redirectUri,
                }),
            });

            const tokenData = await tokenResponse.json();

            if (tokenData.error) {
                logger.error("Spotify token exchange failed", {
                    error: tokenData.error,
                });
                return c.json(
                    {
                        error: "server_error",
                        error_description:
                            "Failed to exchange Spotify token",
                    },
                    500
                );
            }

            // Get user profile to store user ID
            const profileResponse = await fetch(
                "https://api.spotify.com/v1/me",
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                }
            );
            const profile = await profileResponse.json();

            // Generate MCP access token
            const mcpToken = crypto.randomUUID();

            await tokenStore.storeTokens(mcpToken, {
                spotifyAccessToken: tokenData.access_token,
                spotifyRefreshToken: tokenData.refresh_token,
                spotifyUserId: profile.id || "unknown",
                expiresAt:
                    Date.now() + tokenData.expires_in * 1000,
            });

            logger.info("Token exchange completed successfully");

            const MCP_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

            return c.json({
                access_token: mcpToken,
                token_type: "Bearer",
                expires_in: MCP_TOKEN_TTL_SECONDS,
            });
        } catch (err) {
            logger.error("Token exchange error", {
                error: String(err),
            });
            return c.json(
                {
                    error: "server_error",
                    error_description:
                        "Failed to exchange authorization code",
                },
                500
            );
        }
    });

    return oauth;
}

export async function refreshSpotifyToken(
    refreshToken: string,
    config: OAuthConfig
): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}> {
    logger.info("Refreshing Spotify access token");

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
        throw new Error(
            `Failed to refresh Spotify token: ${tokenData.error}`
        );
    }

    logger.info("Token refresh completed successfully");

    return {
        accessToken: tokenData.access_token,
        // Spotify may or may not return a new refresh token
        refreshToken: tokenData.refresh_token || refreshToken,
        expiresIn: tokenData.expires_in,
    };
}
