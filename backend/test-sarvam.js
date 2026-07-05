require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { SarvamTranscriptionService } = require('./dist/services/sarvam.service.js');
const s = new SarvamTranscriptionService();
s.transcribeAudio('../large.bin', undefined, { language: 'hi', script: 'english' }).then(console.log).catch(console.error);
