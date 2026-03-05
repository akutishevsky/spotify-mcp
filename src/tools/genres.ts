import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spotifyRequest } from "../spotify/api.js";
import { withErrorHandling, READ_ANNOTATIONS, toolResponse } from "./index.js";

export function registerGenreTools(
    server: McpServer,
    mcpAccessToken: string
) {
    server.registerTool(
        "get_available_genre_seeds",
        {
            title: "Get Available Genre Seeds",
            description:
                "Retrieve a list of available genres seed parameter values for recommendations.",
            inputSchema: {},
            annotations: READ_ANNOTATIONS,
        },
        () =>
            withErrorHandling("get_available_genre_seeds", async () => {
                const data = await spotifyRequest(mcpAccessToken, {
                    path: "/recommendations/available-genre-seeds",
                });
                return toolResponse(data);
            })
    );
}
