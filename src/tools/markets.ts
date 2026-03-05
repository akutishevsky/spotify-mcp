import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.ts";
import { withErrorHandling, READ_ANNOTATIONS, toolResponse } from "./index.ts";

export function registerMarketTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_available_markets",
        {
            title: "Get Available Markets",
            description:
                "Get the list of markets where Spotify is available.",
            inputSchema: {},
            annotations: READ_ANNOTATIONS,
        },
        () =>
            withErrorHandling("get_available_markets", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/markets",
                });
                return toolResponse(data);
            })
    );
}
