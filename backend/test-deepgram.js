require('dotenv').config();
const fs = require('fs');
async function test() {
  const url = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&words=true";
  console.log(process.env.DEEPGRAM_API_KEY);
}
test();
