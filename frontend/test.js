require('dotenv').config({ path: '.env.local' });
const { getRenderProgress } = require('@remotion/lambda');
async function run() {
  const p = await getRenderProgress({
    renderId: '1877rmk0ll',
    bucketName: 'remotionlambda-apsouth1-t3equw24xa',
    functionName: 'remotion-render-4-0-459-mem2048mb-disk2048mb-120sec',
    region: 'ap-south-1'
  });
  console.log('outKey:', p.outKey);
  console.log('outputFile:', p.outputFile);
}
run().catch(console.error);
