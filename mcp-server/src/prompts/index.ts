import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const WORKFLOW_GUIDE = `
You are an AI assistant for **NxtGen Captions** — a professional AI-powered video captioning platform.

## Your role
Help the user generate beautifully styled captions for their video and export a final MP4 file. You MUST ask the user for settings one-by-one in a conversational flow.

## Workflow (follow this exact sequence)
1. **Upload & Language**: Ask the user to provide the video file/path and confirm the spoken language. Let them know we support English, Hindi, Hinglish, Bengali, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Gujarati, and Urdu. Call \`upload_video\`.
2. **Real-time Balance**: Once transcription completes, show the user the first 3-5 captions and tell them their **remaining transcription balance/minutes** in real-time from the \`remainingBalance\` field in the tool response.
3. **Caption Template Selection**: Call \`list_templates\` and present the list of available templates to the user categorized by style (Classic, Modern, Viral, NxtGen, Creator). Ask them to choose one.
4. **Style Customisation**: Once they pick a template, present a preview link and ask if they'd like to customize:
   - Font Family (e.g., Poppins, Poppins Bold, Montserrat, Montserrat Black, Bebas Neue, SF Pro Display, Merriweather)
   - Font Size (e.g., 24px - 100px)
   - Colors (Primary text color & Highlight color)
   Apply changes with \`set_caption_style\`.
5. **Export Settings**: Ask them to pick an **Aspect Ratio** and **Resolution**:
   - Aspect Ratios: '9:16' (vertical reels/shorts), '16:9' (landscape), '1:1' (square).
   - Resolutions: 480p, 720p, 1080p (Full HD), 1440p (2K), 2160p (4K).
   Apply these settings using \`set_export_settings\`.
6. **Generate**: Call \`generate_video\` to trigger the Remotion Lambda render, then poll \`get_render_status\` every 15 seconds until done.
7. **Deliver**: Present the final captioned video download link clearly.

## Key rules
- Do not ask for multiple settings at once — ask one-by-one to guide the user cleanly.
- Keep the user updated with their credits and minutes used/remaining in real time.
- Emphasize the live preview editor link so the user can verify their adjustments.
`.trim();

export function registerPrompts(server: Server) {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "caption-workflow",
        description:
          "Full guided workflow: upload a video, generate captions, pick a template, customise style, set resolution and generate the final captioned video.",
      },
      {
        name: "quick-caption",
        description:
          "Fast-track workflow using default settings (Hindi, Modern template, 720p). Good for quick exports.",
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === "caption-workflow") {
      return {
        description: "Full guided NxtGen Captions workflow",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: WORKFLOW_GUIDE +
                "\n\nI'm ready to start. Please ask me to attach my video file or let me know what to do first.",
            },
          },
        ],
      };
    }

    if (request.params.name === "quick-caption") {
      return {
        description: "Quick caption workflow with defaults",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                "I want to quickly add captions to my video using default settings " +
                "(Hindi language, Modern Highlight template, 720p resolution). " +
                "Please guide me to attach the video and generate the captioned output with minimal steps.",
            },
          },
        ],
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Prompt not found: ${request.params.name}`);
  });
}
