import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { createOAuthRouter } from "../auth/oauth.ts";
import { authenticateBearer } from "./middleware.ts";
import { handleMcp } from "./mcp-endpoints.ts";
import type { AppEnv } from "../types/hono.ts";
import type { OAuthConfig } from "../config.ts";

export interface ServerConfig {
    oauthConfig: OAuthConfig;
}

const MCP_ENDPOINT = "/mcp";

export function createApp(config: ServerConfig) {
    const app = new Hono<AppEnv>();

    // HTTPS redirect in production
    // Skip when behind a reverse proxy (DO App Platform, etc.) that terminates TLS
    app.use("*", async (c, next) => {
        const proto = c.req.header("x-forwarded-proto");
        const host = c.req.header("host") || "";
        const isLocalhost =
            host.startsWith("localhost") ||
            host.startsWith("127.0.0.1");
        const isBehindProxy = !!c.req.header("x-forwarded-for");

        if (proto === "http" && !isLocalhost && !isBehindProxy) {
            const httpsUrl = `https://${host}${c.req.path}`;
            return c.redirect(httpsUrl, 301);
        }

        await next();
    });

    // Security headers
    app.use("*", async (c, next) => {
        await next();

        if (c.req.url.startsWith("https://")) {
            c.header(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains"
            );
        }

        c.header("X-Content-Type-Options", "nosniff");
        c.header("X-Frame-Options", "DENY");
        c.header(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'"
        );
        c.header("Referrer-Policy", "no-referrer");
        c.header(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=()"
        );
    });

    // Body size limit (1MB)
    app.use(
        "*",
        bodyLimit({
            maxSize: 1024 * 1024,
            onError: (c) => {
                return c.json(
                    {
                        error: "payload_too_large",
                        error_description:
                            "Request body exceeds maximum allowed size",
                    },
                    413
                );
            },
        })
    );

    // CORS
    app.use(
        "*",
        cors({
            origin: (origin) => {
                if (!origin) return null;

                if (
                    origin.match(/^https?:\/\/localhost(:\d+)?$/) ||
                    origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/)
                ) {
                    return origin;
                }

                const allowedOrigins =
                    process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
                        o.trim()
                    ) || [];
                if (allowedOrigins.includes(origin)) {
                    return origin;
                }

                return null;
            },
            allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
            allowHeaders: [
                "Content-Type",
                "Authorization",
                "Mcp-Session-Id",
                "Mcp-Protocol-Version",
                "Last-Event-ID",
                "Accept",
            ],
            exposeHeaders: [
                "Mcp-Session-Id",
                "Mcp-Protocol-Version",
                "Content-Type",
            ],
            credentials: false,
            maxAge: 86400,
        })
    );

    // Root
    app.get("/", (c) => {
        return c.json({
            name: "spotify-mcp",
            version: "1.0.0",
            description:
                "Spotify MCP Server - Full Web API coverage",
            mcp_endpoint: "/mcp",
        });
    });

    // OAuth routes
    app.route("/", createOAuthRouter(config.oauthConfig));

    // MCP endpoint
    app.all(MCP_ENDPOINT, authenticateBearer, handleMcp);

    // OAuth metadata discovery
    app.get("/.well-known/oauth-authorization-server", (c) => {
        const host = c.req.header("host") || new URL(c.req.url).host;
        const isLocalhost =
            host.startsWith("localhost") ||
            host.startsWith("127.0.0.1");
        const proto = isLocalhost ? "http" : "https";
        const baseUrl = `${proto}://${host}`;
        return c.json({
            issuer: baseUrl,
            authorization_endpoint: `${baseUrl}/authorize`,
            token_endpoint: `${baseUrl}/token`,
            registration_endpoint: `${baseUrl}/register`,
            grant_types_supported: [
                "authorization_code",
                "refresh_token",
            ],
            response_types_supported: ["code"],
            code_challenge_methods_supported: ["S256"],
            token_endpoint_auth_methods_supported: [
                "none",
                "client_secret_post",
            ],
            mcp_endpoint: `${baseUrl}${MCP_ENDPOINT}`,
        });
    });

    // Health check
    app.get("/health", (c) => {
        return c.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Error handler
    app.onError((err, c) => {
        console.error("Unhandled error:", err);
        return c.json(
            {
                error: "internal_server_error",
                error_description:
                    "An internal server error occurred. Please try again later.",
            },
            500
        );
    });

    return app;
}
