import "dotenv/config";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import http from "http";

// Use a real video file that has audio content
const testVideoPath = path.join(process.cwd(), "uploads", "video-1777636040883-523889098.mp4");

async function testCompleteWorkflow() {
  console.log("Testing complete workflow with real video...");

  if (!fs.existsSync(testVideoPath)) {
    console.error("Test video file not found:", testVideoPath);
    return;
  }

  const stats = fs.statSync(testVideoPath);
  console.log("✓ Test video file exists:", testVideoPath);
  console.log("  File size:", (stats.size / 1024).toFixed(2), "KB");

  // Create form data
  const form = new FormData();
  form.append("video", fs.createReadStream(testVideoPath));

  // Make request to backend
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/video/upload',
    method: 'POST',
    headers: form.getHeaders()
  };

  console.log("Sending request to backend...");

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
              console.log('📹 Video initialized:', data.videoUrl);
              break;
            case 'status':
              console.log('⏳ Status:', data.message);
              break;
            case 'segment':
              segmentCount++;
              console.log(`💬 Caption #${segmentCount}:`, data.segment.text);
              break;
            case 'complete':
              console.log('✅ COMPLETE! Total captions:', data.captions.length);
              if (data.captions.length > 0) {
                console.log('Sample caption:', data.captions[0]);
                console.log('All captions:', JSON.stringify(data.captions, null, 2));
              } else {
                console.log('⚠️ No captions generated - video may not have audio');
              }
              break;
            case 'error':
              console.error('❌ Error:', data.message);
              break;
          }
        } catch (e) {
          console.error('Error parsing SSE line:', line);
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
}

testCompleteWorkflow();