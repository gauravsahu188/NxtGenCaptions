#!/usr/bin/env node
/**
 * Test script for the Render API
 * Triggers a Remotion Lambda render with a sample video
 */

require("dotenv").config({ path: "../.env.local" });

const TEST_USER_ID = "cmozl63ra00008nit5ogtyqy9";
const TEST_VIDEO_KEY = "video-1777636040883-523889098.mp4";

const sampleCaptions = [
  {
    id: "1",
    start: 0,
    end: 3,
    text: "Welcome to NxtGen Captions",
    words: [
      { word: "Welcome", start: 0, end: 0.8 },
      { word: "to", start: 0.8, end: 1.0 },
      { word: "NxtGen", start: 1.0, end: 1.6 },
      { word: "Captions", start: 1.6, end: 3.0 },
    ],
  },
  {
    id: "2",
    start: 3.5,
    end: 6,
    text: "Create stunning video captions",
    words: [
      { word: "Create", start: 3.5, end: 4.0 },
      { word: "stunning", start: 4.0, end: 4.6 },
      { word: "video", start: 4.6, end: 5.0 },
      { word: "captions", start: 5.0, end: 6.0 },
    ],
  },
];

const testRender = async () => {
  console.log("═══════════════════════════════════════════════════════");
  console.log("    Testing Render API");
  console.log("═══════════════════════════════════════════════════════\n");

  const response = await fetch("http://localhost:3000/api/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      videoKey: `uploads/${TEST_USER_ID}/${TEST_VIDEO_KEY}`,
      captions: sampleCaptions,
      style: {
        template: "modern",
        fontSize: 52,
        primaryColor: "#38bdf8",
        secondaryColor: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.55)",
        fontFamily: "Inter, sans-serif",
        glowColor: "#38bdf8",
        borderRadius: 12,
      },
      aspectRatio: "16:9",
      requestedRes: 720, // Test with 720p (should work for FREE plan)
      duration: 6,
    }),
  });

  console.log("Response status:", response.status);

  const result = await response.json();
  console.log("\nResponse:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success && result.renderId) {
    console.log("\n📋 Render started!");
    console.log("Render ID:", result.renderId);
    console.log("Check status at: GET /api/render/status?renderId=" + result.renderId);
  }
};

testRender().catch(console.error);