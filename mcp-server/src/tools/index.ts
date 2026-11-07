import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { ApiClient } from "../utils/api-client.js";
import fs from "fs";
import path from "path";

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    name: "upload_video",
    description:
      "Upload a video file to NxtGen Captions and generate captions using AI. " +
      "Preferred: Pass absolute 'filePath' to the local video. " +
      "Alternative: Pass 'base64Data'. Supported formats: mp4, mov, webm, avi. " +
      "IMPORTANT: This tool runs locally on the user's computer and has permission to read files directly from the filesystem. " +
      "If the user gives a local file path, DO NOT refuse or ask them to upload the file to the chat. " +
      "Instead, call this tool immediately with the 'filePath' parameter. " +
      "The returned sessionId is used for all subsequent tools.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Absolute path to the video file on the local file system. Preferred method to avoid base64 limits.",
        },
        base64Data: {
          type: "string",
          description: "Base64-encoded video file content (without data: prefix). Use only if filePath is not available.",
        },
        fileName: {
          type: "string",
          description: "Original file name including extension, e.g. 'reel.mp4'.",
        },
        contentType: {
          type: "string",
          description: "MIME type of the video, e.g. 'video/mp4' or 'video/quicktime'.",
          enum: ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"],
        },
        language: {
          type: "string",
          description:
            "Language code of the spoken audio. Use 'auto' to auto-detect. " +
            "Supported: en, hi, bn, kn, ml, mr, od, pa, ta, te, gu, ur, ne, as, mai, doi, kok, sa, ks, sd, sat, mni, brx.",
          default: "auto",
        },
        script: {
          type: "string",
          description:
            "Output script style. 'native' = original script, 'romanised' = Latin script, 'english' = English translation.",
          enum: ["native", "romanised", "english"],
          default: "native",
        },
      },
      // Removed strict requires for base64Data to allow filePath as primary option
      required: [],
    },
  },
  {
    name: "list_templates",
    description:
      "List all available caption templates with descriptions and preview style details. " +
      "Show these to the user and ask them to pick one before proceeding.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "set_caption_style",
    description:
      "Set or update the caption visual style for the current session. " +
      "You can set the template, font family, font size, colours, position and more. " +
      "Call this after the user has chosen a template and any customisations.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID returned by upload_video.",
        },
        template: {
          type: "string",
          description:
            "Template ID. One of: bottom, center, modern, hormozi, bubble, nxtgen-genz, nxtgen-alpha, nxtgen-viral, nxtgen-horror, nxtgen-cinemaline, ali-abdaal, apple.",
        },
        fontFamily: {
          type: "string",
          description: "Font family name, e.g. 'Inter', 'Poppins', 'Montserrat', 'Bebas Neue'.",
        },
        fontSize: {
          type: "number",
          description: "Font size in pixels (16–120). Will be automatically clamped to fit within the video width.",
        },
        primaryColor: {
          type: "string",
          description: "Primary text colour as hex, e.g. '#FFFFFF'.",
        },
        emphasisColor: {
          type: "string",
          description: "Highlight/emphasis word colour as hex, e.g. '#FACC15'.",
        },
        positionX: {
          type: "number",
          description: "Horizontal position as percentage (0–100). 50 = centre.",
        },
        positionY: {
          type: "number",
          description: "Vertical position as percentage (0–100). 85 = near bottom.",
        },
        width: {
          type: "number",
          description: "Caption box width as percentage of video width (10–95). Default 80.",
        },
        textAlignment: {
          type: "string",
          enum: ["left", "center", "right"],
          description: "Text alignment within the caption box.",
        },
        fontWeight: {
          type: "string",
          enum: ["400", "500", "600", "700", "800", "900"],
          description: "Font weight.",
        },
        dropShadow: {
          type: "boolean",
          description: "Enable drop shadow on text.",
        },
        letterSpacing: {
          type: "number",
          description: "Letter spacing in pixels.",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "set_export_settings",
    description:
      "Set the output video resolution and bitrate before generating the final video. " +
      "Resolution availability depends on the user's plan (FREE: up to 720p, EDITOR: 1080p, CREATOR/BUSINESS: 2160p).",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID returned by upload_video.",
        },
        resolution: {
          type: "number",
          description: "Output height in pixels. One of: 480, 720, 1080, 1440, 2160.",
          enum: [480, 720, 1080, 1440, 2160],
        },
        bitrate: {
          type: "string",
          description:
            "Target video bitrate. 'auto' lets the encoder decide (recommended). " +
            "Manual options: 1M, 2M, 4M, 6M, 8M, 12M, 16M.",
          enum: ["auto", "1M", "2M", "4M", "6M", "8M", "12M", "16M"],
          default: "auto",
        },
        aspectRatio: {
          type: "string",
          description: "Output video aspect ratio. Options: '9:16' (portrait/reels/shorts), '16:9' (landscape/long-form), '1:1' (square). Defaults to the video's original aspect ratio.",
          enum: ["9:16", "16:9", "1:1"],
        },
      },
      required: ["sessionId", "resolution"],
    },
  },
  {
    name: "preview_captions",
    description:
      "Get a direct link to the NxtGen Captions web editor pre-loaded with the current session. " +
      "Share this link with the user so they can see a live preview and make fine-tuned edits.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID returned by upload_video.",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "generate_video",
    description:
      "Start generating the final captioned video with all current style and export settings. " +
      "Returns a renderId — use get_render_status to poll for completion and get the download link. " +
      "Rendering typically takes 1–3 minutes for a 1-minute video.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID returned by upload_video.",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "get_render_status",
    description:
      "Poll the rendering progress of a video. " +
      "Call this every 15 seconds until 'done' is true, then share the downloadUrl with the user.",
    inputSchema: {
      type: "object",
      properties: {
        renderId: {
          type: "string",
          description: "The renderId returned by generate_video.",
        },
      },
      required: ["renderId"],
    },
  },
  {
    name: "edit_caption",
    description:
      "Edit the text of a specific caption segment. " +
      "Use this when the user wants to correct a word or rephrase a caption.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID returned by upload_video.",
        },
        captionId: {
          type: "string",
          description: "The 'id' field of the caption segment to edit.",
        },
        newText: {
          type: "string",
          description: "The replacement text for the caption segment.",
        },
      },
      required: ["sessionId", "captionId", "newText"],
    },
  },
  {
    name: "list_projects",
    description: "List all your existing NxtGen Captions projects.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ─── Tool Handlers ───────────────────────────────────────────────────────────

export function registerTools(server: Server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const apiClient = new ApiClient();
    const { name, arguments: args } = request.params;
    
    console.error(`[MCP Debug] Tool call: ${name} with args:`, JSON.stringify(args));

    try {
      // ── upload_video ────────────────────────────────────────────────────
      if (name === "upload_video") {
        const { filePath, base64Data, language = "auto", script = "native" } = args as any;
        let { fileName, contentType } = args as any;
        let binary: Buffer;

        // ── Resolve binary from filePath or base64Data ───────────────────
        if (filePath) {
          let resolvedPath = filePath;
          if (!fs.existsSync(resolvedPath)) {
            // Self-healing: if path is virtual sandboxed (e.g. starts with /mnt/ or /home/),
            // try to resolve it to the user's local Downloads or workspace directory.
            const baseName = path.basename(filePath);
            const downloadsPath = path.join("/Users/gauravsahu/Downloads", baseName);
            const workspacePath = path.join("/Users/gauravsahu/Documents/NxtGen Captions", baseName);
            
            if (fs.existsSync(downloadsPath)) {
              console.error(`[MCP Debug] Resolved virtual path ${filePath} to local Downloads: ${downloadsPath}`);
              resolvedPath = downloadsPath;
            } else if (fs.existsSync(workspacePath)) {
              console.error(`[MCP Debug] Resolved virtual path ${filePath} to local Workspace: ${workspacePath}`);
              resolvedPath = workspacePath;
            } else {
              throw new McpError(ErrorCode.InvalidParams, `File not found at path: ${filePath} (tried downloads: ${downloadsPath})`);
            }
          }
          binary = fs.readFileSync(resolvedPath);
          fileName = fileName || path.basename(filePath);
          if (!contentType) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeMap: Record<string, string> = {
              ".mp4": "video/mp4", ".mov": "video/quicktime",
              ".webm": "video/webm", ".avi": "video/x-msvideo",
            };
            contentType = mimeMap[ext] || "video/mp4";
          }
        } else if (base64Data && fileName) {
          binary = Buffer.from(base64Data, "base64");
          contentType = contentType || "video/mp4";
        } else {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Provide 'filePath' (absolute path to video on disk) or 'base64Data' + 'fileName'."
          );
        }

        // ── POST binary as multipart to /api/mcp/transcribe ─────────────
        // The route creates the McpSession + forwards to backend for
        // transcription in one step (same flow as the web UI).
        const apiUrl = process.env.NXTGEN_API_URL || "http://localhost:3000";
        const boundary = `----NxtGenBoundary${Date.now()}`;

        // Build multipart body manually (Node's fetch doesn't support FormData with Buffers cleanly)
        const CRLF = "\r\n";
        const fieldPart = (name: string, value: string) =>
          `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`;

        const textParts = Buffer.from(
          fieldPart("language", language) +
          fieldPart("script", script),
          "utf8"
        );
        const fileHeader = Buffer.from(
          `--${boundary}${CRLF}` +
          `Content-Disposition: form-data; name="video"; filename="${fileName}"${CRLF}` +
          `Content-Type: ${contentType}${CRLF}${CRLF}`,
          "utf8"
        );
        const fileFooter = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, "utf8");
        const bodyBuffer = Buffer.concat([textParts, fileHeader, binary, fileFooter]);

        const res = await fetch(`${apiUrl}/api/mcp/transcribe`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NXTGEN_API_KEY}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": String(bodyBuffer.length),
          },
          body: bodyBuffer,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(`Transcription failed (${res.status}): ${errText.slice(0, 300)}`);
        }

        const transcribeRes = await res.json();
        const { sessionId, captions, duration, captionCount, transcriptionBalance = 0 } = transcribeRes;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  sessionId,
                  duration: `${Math.round(duration || 0)}s`,
                  captionCount,
                  remainingBalance: `${transcriptionBalance.toFixed(2)} minutes`,
                  message: `✅ ${captionCount} captions generated! Session ID: ${sessionId}`,
                  captions: (captions || []).slice(0, 5),
                  note: "Use sessionId in all subsequent tools.",
                },
                null,
                2
              ),
            },
          ],
        };
      }


      // ── list_templates ──────────────────────────────────────────────────
      if (name === "list_templates") {
        const res = await apiClient.get("/api/mcp/templates");
        const { grouped } = res;

        const formatted = grouped
          .map((cat: any) => {
            const items = cat.templates
              .map((t: any) => `  • **${t.name}** (id: \`${t.id}\`)\n    ${t.description}`)
              .join("\n");
            return `**${cat.category}**\n${items}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `## Available Caption Templates\n\n${formatted}\n\nAsk the user which template they'd like, then call \`set_caption_style\` with the template id.`,
            },
          ],
        };
      }

      // ── set_caption_style ───────────────────────────────────────────────
      if (name === "set_caption_style") {
        const { sessionId, template, ...styleArgs } = args as any;

        if (!sessionId) throw new McpError(ErrorCode.InvalidParams, "sessionId is required.");

        // Build style object from args
        const style: Record<string, any> = {};
        if (template) style.layout = template;
        if (styleArgs.fontFamily)    style.fontFamily    = styleArgs.fontFamily;
        if (styleArgs.fontSize)      style.fontSize      = Number(styleArgs.fontSize);
        if (styleArgs.primaryColor)  style.primaryColor  = styleArgs.primaryColor;
        if (styleArgs.emphasisColor) style.emphasisColor = styleArgs.emphasisColor;
        if (styleArgs.positionX !== undefined) style.positionX = Number(styleArgs.positionX);
        if (styleArgs.positionY !== undefined) style.positionY = Number(styleArgs.positionY);
        if (styleArgs.width !== undefined)     style.width     = Number(styleArgs.width);
        if (styleArgs.textAlignment) style.textAlignment = styleArgs.textAlignment;
        if (styleArgs.fontWeight)    style.fontWeight    = styleArgs.fontWeight;
        if (styleArgs.dropShadow !== undefined) style.dropShadow = styleArgs.dropShadow;
        if (styleArgs.letterSpacing !== undefined) style.letterSpacing = Number(styleArgs.letterSpacing);

        const res = await apiClient.post("/api/mcp/style", { sessionId, style });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  sessionId,
                  appliedStyle: res.style,
                  previewUrl: res.previewUrl,
                  message: `✅ Caption style updated. Preview: ${res.previewUrl}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── set_export_settings ─────────────────────────────────────────────
      if (name === "set_export_settings") {
        const { sessionId, resolution, bitrate = "auto", aspectRatio } = args as any;

        if (!sessionId) throw new McpError(ErrorCode.InvalidParams, "sessionId is required.");
        if (!resolution) throw new McpError(ErrorCode.InvalidParams, "resolution is required.");

        const payload: Record<string, any> = {
          sessionId,
          requestedRes: Number(resolution),
          bitrate,
        };
        if (aspectRatio) {
          payload.style = { aspectRatio };
        }

        const res = await apiClient.post("/api/mcp/style", payload);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  sessionId,
                  requestedRes: res.requestedRes,
                  bitrate: res.bitrate,
                  message: `✅ Export settings set: ${resolution}p, bitrate: ${bitrate}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── preview_captions ────────────────────────────────────────────────
      if (name === "preview_captions") {
        const { sessionId } = args as any;
        if (!sessionId) throw new McpError(ErrorCode.InvalidParams, "sessionId is required.");

        const apiUrl = process.env.NXTGEN_API_URL || "http://localhost:3001";
        const previewUrl = `${apiUrl}/editor?session=${sessionId}`;

        return {
          content: [
            {
              type: "text",
              text: `## 👁️ Live Preview\n\nOpen this link to see and fine-tune your captions in the full editor:\n\n**${previewUrl}**\n\nYou can adjust fonts, colours, positions and timing there, then come back here to generate the final video.`,
            },
          ],
        };
      }

      // ── generate_video ──────────────────────────────────────────────────
      if (name === "generate_video") {
        const { sessionId } = args as any;
        if (!sessionId) throw new McpError(ErrorCode.InvalidParams, "sessionId is required.");

        const res = await apiClient.post("/api/mcp/render", { sessionId });

        const { renderId, estimatedMinutes, finalRes, dimensions } = res;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  renderId,
                  finalRes: `${finalRes}p`,
                  dimensions: `${dimensions?.width}×${dimensions?.height}`,
                  estimatedMinutes,
                  message: `🎬 Rendering started! Estimated time: ${estimatedMinutes} minute(s). Use get_render_status with renderId "${renderId}" to check progress.`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── get_render_status ───────────────────────────────────────────────
      if (name === "get_render_status") {
        const { renderId } = args as any;
        if (!renderId) throw new McpError(ErrorCode.InvalidParams, "renderId is required.");

        const res = await apiClient.get(`/api/mcp/render/${renderId}`);

        const { done, overallProgress, downloadUrl, fatalErrorEncountered, errors } = res;

        if (fatalErrorEncountered) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Render failed.\n\nErrors:\n${(errors || []).map((e: any) => e.message || JSON.stringify(e)).join("\n")}`,
              },
            ],
          };
        }

        if (done && downloadUrl) {
          return {
            content: [
              {
                type: "text",
                text: `## ✅ Video Ready!\n\n**Download your captioned video here:**\n${downloadUrl}\n\n> This link expires in 1 hour. Download it now!`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `⏳ Rendering in progress: **${overallProgress}%** complete.\n\nCall \`get_render_status\` again in 15 seconds to check again.`,
            },
          ],
        };
      }

      // ── edit_caption ────────────────────────────────────────────────────
      if (name === "edit_caption") {
        const { sessionId, captionId, newText } = args as any;
        if (!sessionId || !captionId || !newText) {
          throw new McpError(ErrorCode.InvalidParams, "sessionId, captionId, and newText are required.");
        }

        // Load session from API
        const sessionRes = await apiClient.get(`/api/mcp/transcribe?sessionId=${sessionId}`);
        if (!sessionRes.captions) {
          throw new McpError(ErrorCode.InvalidParams, "Session not found or captions not ready.");
        }

        const captions: any[] = sessionRes.captions;
        const idx = captions.findIndex((c: any) => c.id === captionId);

        if (idx === -1) {
          throw new McpError(ErrorCode.InvalidParams, `Caption with id "${captionId}" not found.`);
        }

        // Edit caption text
        const updatedCaptions = captions.map((c: any) =>
          c.id === captionId ? { ...c, text: newText } : c
        );

        // Save updated captions
        await apiClient.post("/api/mcp/style", {
          sessionId,
          captions: updatedCaptions,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                captionId,
                oldText: captions[idx].text,
                newText,
                message: `✅ Caption updated successfully.`,
              }, null, 2),
            },
          ],
        };
      }

      // ── list_projects ───────────────────────────────────────────────────
      if (name === "list_projects") {
        const res = await apiClient.get("/api/mcp/projects");
        const { projects } = res;

        if (!projects?.length) {
          return {
            content: [{ type: "text", text: "No projects found. Upload your first video with `upload_video`!" }],
          };
        }

        const list = projects
          .map((p: any, i: number) => `${i + 1}. **${p.title}** (ID: ${p.id}) — ${p.duration ? `${p.duration}s` : "—"} — ${new Date(p.createdAt).toLocaleDateString()}`)
          .join("\n");

        return {
          content: [{ type: "text", text: `## Your Projects\n\n${list}` }],
        };
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    } catch (error: any) {
      if (error instanceof McpError) throw error;

      console.error(`[MCP Tools] Error in ${name}:`, error.message);
      return {
        content: [{ type: "text", text: `❌ Error in ${name}: ${error.message}` }],
        isError: true,
      };
    }
  });
}
