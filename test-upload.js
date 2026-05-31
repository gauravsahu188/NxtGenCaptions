const fs = require('fs');
const http = require('http');
const FormData = require('form-data');

const form = new FormData();
// We just need a valid file, let's use a dummy file
fs.writeFileSync('dummy.mp4', 'dummy content');
form.append('video', fs.createReadStream('dummy.mp4'));
form.append('language', 'en');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/video/upload',
  method: 'POST',
  headers: form.getHeaders(),
}, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});

form.pipe(req);
