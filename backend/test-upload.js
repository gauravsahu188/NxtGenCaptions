const fs = require('fs');
const http = require('http');
const FormData = require('form-data');

const form = new FormData();
form.append('video', fs.createReadStream('test.mp4'));
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
