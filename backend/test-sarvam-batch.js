require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const apiKey = process.env.SARVAM_API_KEY;
fetch("https://api.sarvam.ai/transliterate", {
  method: "POST",
  headers: {
    "api-subscription-key": apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    input: "मैं ऑफिस जा रहा हूँ\nक्या चल रहा है",
    source_language_code: "hi-IN",
    target_language_code: "en-IN"
  })
}).then(res => res.json()).then(console.log).catch(console.error);
