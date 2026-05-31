import "dotenv/config";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import http from "http";

// Use a real video file that has audio content
const testVideoPath = path.join(process.cwd(), "uploads", "video-1777636040883-523889098.mp4");

async function testHinglishSupport() {
  console.log("Testing Hinglish language support...");

  if (!fs.existsSync(testVideoPath)) {
    console.error("Test video file not found:", testVideoPath);
    return;
  }

  const stats = fs.statSync(testVideoPath);
  console.log("✓ Test video file exists:", testVideoPath);
  console.log("  File size:", (stats.size / 1024).toFixed(2), "KB");

  // Test different languages
  const languages = ["auto", "en", "hinglish", "hi"];

  for (const language of languages) {
    console.log(`\n=== Testing language: ${language} ===`);

    // Create form data
    const form = new FormData();
    form.append("video", fs.createReadStream(testVideoPath));
    form.append("language", language);

    // Make request to backend
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/video/upload',
      method: 'POST',
      headers: form.getHeaders()
    };

    console.log(`Sending request with language: ${language}...`);

    const req = http.request(options, (res) => {
      console.log(`Response status: ${res.statusCode}`);

      let buffer = '';
      let segmentCount = 0;

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        // Process SSE events
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.replace('data: ', ''));

            switch (data.type) {
              case 'init':
                console.log('📹 Video initialized');
                break;
              case 'status':
                console.log('⏳ Status:', data.message);
                break;
              case 'segment':
                segmentCount++;
                if (segmentCount <= 2) { // Only show first 2 segments
                  console.log(`💬 Caption #${segmentCount}:`, data.segment.text);
                }
                break;
              case 'complete':
                console.log(`✅ COMPLETE! Total captions: ${data.captions.length}`);
                if (data.captions.length > 0) {
                  console.log('Sample caption:', data.captions[0]);
                }
                break;
              case 'error':
                console.error('❌ Error:', data.message);
                break;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });

      res.on('end', () => {
        console.log('✓ Request completed');
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });

    form.pipe(req);

    // Wait for this request to complete before testing next language
    await new Promise(resolve => setTimeout(resolve, 8000));
  }
}

testHinglishSupport();