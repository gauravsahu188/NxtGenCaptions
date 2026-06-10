const urls = [
  "https://my-bucket.s3.us-east-1.amazonaws.com/my-key/file.mp4",
  "https://s3.ap-south-1.amazonaws.com/nxtgen-completed-exports/users/file.mp4",
  "s3://my-bucket/my-key/file.mp4"
];

urls.forEach(url => {
  let bucket, key;
  if (url.startsWith("s3://")) {
    const match = url.match(/s3:\/\/([^/]+)\/(.+)/);
    if (match) { bucket = match[1]; key = match[2]; }
  } else if (url.startsWith("https://s3")) {
    // Path-style: https://s3.region.amazonaws.com/bucket/key
    const match = url.match(/https:\/\/s3[^/]*\.amazonaws\.com\/([^/]+)\/(.+)/);
    if (match) { bucket = match[1]; key = match[2]; }
  } else if (url.startsWith("https://")) {
    // Virtual-hosted style: https://bucket.s3.region.amazonaws.com/key
    const match = url.match(/https:\/\/([^.]+)\.s3[^/]*\/(.+)/);
    if (match) { bucket = match[1]; key = match[2]; }
  }
  console.log({ url, bucket, key });
});
