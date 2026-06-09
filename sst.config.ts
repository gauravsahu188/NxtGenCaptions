/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "nxtgen-captions",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "ap-south-1",
        },
      },
    };
  },
  async run() {
    // ACM certificates for CloudFront must be in us-east-1
    const usEast1 = new aws.Provider("UsEast1", { region: "us-east-1" });

    // Request the ACM SSL Certificate automatically
    const certificate = new aws.acm.Certificate("SiteCert", {
      domainName: "nxtgencaptions.com",
      validationMethod: "DNS",
      subjectAlternativeNames: ["www.nxtgencaptions.com"],
    }, { provider: usEast1 });

    const validationOptions = certificate.domainValidationOptions;

    // Deploy the Next.js frontend site
    const site = new sst.aws.Nextjs("MyWeb", {
      path: "frontend",
      domain: {
        name: "nxtgencaptions.com",
        dns: false,
        cert: certificate.arn,
      },
      environment: {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
        REMOTION_AWS_REGION: process.env.REMOTION_AWS_REGION || process.env.REMOTION_REGION || "ap-south-1",
      },
    });

    return {
      DomainValidationRecords: validationOptions.apply((options) =>
        options.map((opt) => ({
          name: opt.resourceRecordName,
          type: opt.resourceRecordType,
          value: opt.resourceRecordValue,
        }))
      ),
      SiteUrl: site.url,
    };
  },
});
