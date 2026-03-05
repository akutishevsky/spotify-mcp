import { getSupabaseClient } from "../db/supabase.ts";
import { encrypt, decrypt } from "../utils/encryption.ts";

export interface TokenData {
    spotifyAccessToken: string;
    spotifyRefreshToken: string;
    spotifyUserId: string;
    expiresAt: number;
}

interface McpTokenRow {
    mcp_token: string;
    encrypted_access_token: string;
    encrypted_refresh_token: string;
    spotify_user_id: string;
    spotify_expires_at: number;
    expires_at: string;
}

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

class TokenStore {
    async init(): Promise<void> {}

    async storeTokens(
        mcpToken: string,
        tokenData: TokenData
    ): Promise<void> {
        const supabase = getSupabaseClient();
        const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

        const { error } = await supabase.from("mcp_tokens").upsert(
            {
                mcp_token: mcpToken,
                encrypted_access_token: encrypt(
                    tokenData.spotifyAccessToken
                ),
                encrypted_refresh_token: encrypt(
                    tokenData.spotifyRefreshToken
                ),
                spotify_user_id: tokenData.spotifyUserId,
                spotify_expires_at: tokenData.expiresAt,
                expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "mcp_token" }
        );

        if (error) {
            throw new Error(`Failed to store tokens: ${error.message}`);
        }
    }

    async getTokens(mcpToken: string): Promise<TokenData | null> {
        const supabase = getSupabaseClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from("mcp_tokens")
            .select("*")
            .eq("mcp_token", mcpToken)
            .gt("expires_at", now)
            .single();

        if (error || !data) return null;

        const row = data as McpTokenRow;

        return {
            spotifyAccessToken: decrypt(row.encrypted_access_token),
            spotifyRefreshToken: decrypt(row.encrypted_refresh_token),
            spotifyUserId: row.spotify_user_id,
            expiresAt: row.spotify_expires_at,
        };
    }

    async isValid(mcpToken: string): Promise<boolean> {
        const data = await this.getTokens(mcpToken);
        return data !== null;
    }

    async updateTokens(
        mcpToken: string,
        updates: Partial<TokenData>
    ): Promise<void> {
        const supabase = getSupabaseClient();
        const existing = await this.getTokens(mcpToken);
        if (!existing) throw new Error("Token not found");

        const updatedData: TokenData = { ...existing, ...updates };

        const { error } = await supabase
            .from("mcp_tokens")
            .update({
                encrypted_access_token: encrypt(
                    updatedData.spotifyAccessToken
                ),
                encrypted_refresh_token: encrypt(
                    updatedData.spotifyRefreshToken
                ),
                spotify_user_id: updatedData.spotifyUserId,
                spotify_expires_at: updatedData.expiresAt,
                updated_at: new Date().toISOString(),
            })
            .eq("mcp_token", mcpToken);

        if (error) {
            throw new Error(`Failed to update tokens: ${error.message}`);
        }
    }

    async deleteToken(mcpToken: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from("mcp_tokens")
            .delete()
            .eq("mcp_token", mcpToken);

        if (error) {
            throw new Error(`Failed to delete token: ${error.message}`);
        }
    }
}

export const tokenStore = new TokenStore();
