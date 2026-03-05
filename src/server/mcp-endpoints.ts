import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerAllTools } from "../tools/index.ts";
import { createLogger } from "../utils/logger.ts";
import type { AppContext } from "../types/hono.ts";

const logger = createLogger({ component: "mcp-endpoints" });

const sessions = new Map<
    string,
    {
        transport: WebStandardStreamableHTTPServerTransport;
        mcpToken: string;
    }
>();

export const handleMcp = async (c: AppContext) => {
    const mcpToken = c.get("accessToken");
    const sessionId = c.req.header("mcp-session-id");

    const session = sessionId ? sessions.get(sessionId) : undefined;

    if (sessionId && !session) {
        return c.json(
            {
                error: "invalid_session",
                error_description: "Session not found or expired",
            },
            404
        );
    }

    if (session && session.mcpToken !== mcpToken) {
        logger.warn(
            "Session access denied: token does not match session owner"
        );
        return c.json(
            {
                error: "forbidden",
                error_description:
                    "Token does not match session owner",
            },
            403
        );
    }

    if (session) {
        return session.transport.handleRequest(c.req.raw);
    }

    if (c.req.method !== "POST") {
        return c.json(
            {
                error: "invalid_request",
                error_description:
                    "No session. Send an initialization POST to create one.",
            },
            400
        );
    }

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
            sessions.set(id, { transport, mcpToken });
            logger.info("MCP session established");
        },
        onsessionclosed: (id) => {
            sessions.delete(id);
            logger.info("MCP session closed");
        },
    });

    const server = new McpServer(
        { name: "spotify-mcp", version: "1.0.0" },
        { capabilities: { tools: {} } }
    );
    registerAllTools(server, mcpToken);
    await server.connect(transport);

    return transport.handleRequest(c.req.raw);
};
