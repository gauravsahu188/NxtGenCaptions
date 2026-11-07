/**
 * GET /api/mcp/templates
 *
 * Returns all available caption templates with metadata.
 * Used by the MCP tool `list_templates` so Claude can present
 * the options to the user.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateMcpKey } from "@/lib/mcp-auth";

export const TEMPLATES = [
  {
    id: "bottom",
    name: "Classic Bottom",
    description: "Simple white text at the bottom. Clean and universally readable.",
    category: "Classic",
    defaultStyle: {
      layout: "bottom",
      fontFamily: "Inter",
      fontSize: 52,
      primaryColor: "#FFFFFF",
      fontWeight: "700",
    },
  },
  {
    id: "center",
    name: "Centered Bold",
    description: "Center-screen bold captions — great for podcasts and talking heads.",
    category: "Classic",
    defaultStyle: {
      layout: "center",
      fontFamily: "Inter",
      fontSize: 52,
      primaryColor: "#FFFFFF",
      fontWeight: "800",
    },
  },
  {
    id: "modern",
    name: "Modern Highlight",
    description: "Highlights the current word in a contrasting colour — very popular on Reels.",
    category: "Modern",
    defaultStyle: {
      layout: "modern",
      fontFamily: "Poppins",
      fontSize: 56,
      primaryColor: "#FFFFFF",
      emphasisColor: "#FACC15",
      fontWeight: "800",
    },
  },
  {
    id: "hormozi",
    name: "Hormozi Style",
    description: "ALL-CAPS bold words, one or two at a time. High impact for motivational content.",
    category: "Viral",
    defaultStyle: {
      layout: "hormozi",
      fontFamily: "Montserrat",
      fontSize: 72,
      primaryColor: "#FFFFFF",
      emphasisColor: "#FF6B35",
      fontWeight: "900",
    },
  },
  {
    id: "bubble",
    name: "Bubble Pop",
    description: "Words appear with a colourful bubble background. Fun and playful.",
    category: "Viral",
    defaultStyle: {
      layout: "bubble",
      fontFamily: "Poppins",
      fontSize: 52,
      primaryColor: "#FFFFFF",
      bubblePrimaryColor: "#6C63FF",
      fontWeight: "700",
    },
  },
  {
    id: "nxtgen-genz",
    name: "NxtGen GenZ",
    description: "Bold, fast-cut word animations with vibrant colours — made for GenZ audiences.",
    category: "NxtGen",
    defaultStyle: {
      layout: "nxtgen-genz",
      fontFamily: "Poppins",
      fontSize: 60,
      primaryColor: "#FFFFFF",
      emphasisColor: "#FF6BFF",
      fontWeight: "900",
    },
  },
  {
    id: "nxtgen-alpha",
    name: "NxtGen Alpha",
    description: "Sleek dark-mode style with subtle glow effects — premium look.",
    category: "NxtGen",
    defaultStyle: {
      layout: "nxtgen-alpha",
      fontFamily: "Inter",
      fontSize: 56,
      primaryColor: "#FFFFFF",
      emphasisGlowColor: "#38BDF8",
      fontWeight: "800",
    },
  },
  {
    id: "nxtgen-viral",
    name: "NxtGen Viral",
    description: "Kinetic word-by-word animations optimised for short-form viral content.",
    category: "NxtGen",
    defaultStyle: {
      layout: "nxtgen-viral",
      fontFamily: "Montserrat",
      fontSize: 64,
      primaryColor: "#FFFFFF",
      emphasisColor: "#00FF88",
      fontWeight: "900",
    },
  },
  {
    id: "nxtgen-horror",
    name: "NxtGen Horror",
    description: "Creepy red-and-black styling — perfect for horror, thriller or dramatic content.",
    category: "NxtGen",
    defaultStyle: {
      layout: "nxtgen-horror",
      fontFamily: "Bebas Neue",
      fontSize: 64,
      primaryColor: "#FF2222",
      emphasisColor: "#FF0000",
      fontWeight: "900",
    },
  },
  {
    id: "nxtgen-cinemaline",
    name: "Cinema Line",
    description: "Movie-style letterbox captions with a cinematic feel.",
    category: "NxtGen",
    defaultStyle: {
      layout: "nxtgen-cinemaline",
      fontFamily: "Merriweather",
      fontSize: 44,
      primaryColor: "#FFFFFF",
      fontWeight: "700",
    },
  },
  {
    id: "ali-abdaal",
    name: "Ali Abdaal Style",
    description: "Side-panel emphasis style popularised by productivity YouTubers.",
    category: "Creator",
    defaultStyle: {
      layout: "ali-abdaal",
      fontFamily: "Inter",
      fontSize: 48,
      primaryColor: "#FFFFFF",
      emphasisColor: "#34D399",
      fontWeight: "700",
    },
  },
  {
    id: "apple",
    name: "Apple Keynote",
    description: "Clean, minimal sans-serif text — inspired by Apple's presentation style.",
    category: "Minimal",
    defaultStyle: {
      layout: "apple",
      fontFamily: "SF Pro Display",
      fontSize: 48,
      primaryColor: "#FFFFFF",
      fontWeight: "600",
    },
  },
];

export async function GET(request: NextRequest) {
  const auth = await validateMcpKey(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Group by category
  const categories = [...new Set(TEMPLATES.map((t) => t.category))];
  const grouped = categories.map((cat) => ({
    category: cat,
    templates: TEMPLATES.filter((t) => t.category === cat).map(({ id, name, description, defaultStyle }) => ({
      id,
      name,
      description,
      defaultStyle,
    })),
  }));

  return NextResponse.json({ templates: TEMPLATES, grouped });
}
