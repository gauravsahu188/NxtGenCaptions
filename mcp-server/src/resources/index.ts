import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema, ListResourceTemplatesRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

export function registerResources(server: Server) {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "nxtgen://health",
          name: "Platform Health",
          description: "Check if the NxtGen API is online",
          mimeType: "application/json",
        },
      ],
    };
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === "nxtgen://health") {
      return {
        contents: [
          {
            uri: "nxtgen://health",
            mimeType: "application/json",
            text: JSON.stringify({ status: "healthy", message: "NxtGen API is online" }),
          }
        ]
      };
    }
    throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${request.params.uri}`);
  });
}
