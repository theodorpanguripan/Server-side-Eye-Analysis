const { S3Client } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: "AKIAQNEKXBK6ZNI4MBXQ",
    secretAccessKey: "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",
  },
});

module.exports = { s3Client };