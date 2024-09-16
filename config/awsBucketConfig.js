const { S3Client } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports = { s3Client };