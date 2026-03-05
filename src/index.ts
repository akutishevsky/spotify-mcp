import { initSupabase } from "./db/supabase.ts";
import { initOAuthStore } from "./auth/oauth.ts";
import { tokenStore } from "./auth/token-store.ts";
import { createApp } from "./server/app.ts";
import { setOAuthConfig } from "./config.ts";
import { startCleanupScheduler } from "./db/cleanup.ts";

// Initialize Supabase first (required by all stores)
await initSupabase();

// Initialize stores
await tokenStore.init();
await initOAuthStore();

// Validate required environment variables
const requiredEnvVars = [
    "SPOTIFY_CLIENT_ID",
    "SPOTIFY_CLIENT_SECRET",
    "SPOTIFY_REDIRECT_URI",
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(
            `Missing required environment variable: ${envVar}`
        );
    }
}

// OAuth configuration from environment
const oauthConfig = {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
};

setOAuthConfig(oauthConfig);

// Create and configure the app
const app = createApp({ oauthConfig });

// Start background cleanup for expired records
startCleanupScheduler();

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`Spotify MCP server running on port ${port}`);

export default {
    port,
    fetch: app.fetch,
};
