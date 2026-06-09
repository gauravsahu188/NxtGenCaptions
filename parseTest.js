const urls = [
  "s3://my-bucket/my-key/file.mp4",
  "https://my-bucket.s3.us-east-1.amazonaws.com/my-key/file.mp4",
  "https://my-bucket.s3.amazonaws.com/my-key/file.mp4"
];

urls.forEach(url => {
  let bucket, key;
  if (url.startsWith("s3://")) {
    const match = url.match(/s3:\/\/([^/]+)\/(.+)/);
    if (match) { bucket = match[1]; key = match[2]; }
  } else if (url.startsWith("https://")) {
    const match = url.match(/https:\/\/([^.]+)\.s3[^/]*\/(.+)/);
    if (match) { bucket = match[1]; key = match[2]; }
  }
  console.log({ url, bucket, key });
});
