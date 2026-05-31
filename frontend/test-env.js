const fs = require('fs');
const envLocal = fs.readFileSync('.env.local', 'utf8');
console.log(envLocal.includes('GOOGLE_CLIENT_ID=""') ? "Empty" : "Not Empty");
