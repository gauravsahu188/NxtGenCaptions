const { removeBackground } = require('@imgly/background-removal-node');

async function test() {
  console.log("Starting...");
  const start = Date.now();
  try {
    // Generate a dummy image using a public URL or local file if available
    const blob = await removeBackground("https://raw.githubusercontent.com/imgly/background-removal-node/main/example/public/dummy.jpg");
    console.log("Time taken:", Date.now() - start, "ms");
  } catch (err) {
    console.error(err);
  }
}
test();
