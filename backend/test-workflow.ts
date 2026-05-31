import "dotenv/config";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import http from "http";

const testVideoPath = path.join(process.cwd(), "temp", "dummy.mp4");

async function testCompleteWorkflow() {
  console.log("Testing complete workflow...");

  if (!fs.existsSync(testVideoPath)) {
    console.error("Test video file not found:", testVideoPath);
    return;
  }

  console.log("✓ Test video file exists");

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
    console.log(`Response headers: ${JSON.stringify(res.headers)}`);

    let buffer = '';

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
              console.log('💬 Caption segment:', data.segment.text);
              break;
            case 'complete':
              console.log('✅ COMPLETE! Total captions:', data.captions.length);
              console.log('Sample caption:', data.captions[0]);
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