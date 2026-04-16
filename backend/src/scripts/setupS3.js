const dotenv = require('dotenv');
const { HeadBucketCommand } = require('@aws-sdk/client-s3');
const { createS3Client, getS3Config } = require('../config/s3');

dotenv.config();

async function run() {
  try {
    const s3 = createS3Client();
    const config = getS3Config();

    await s3.send(new HeadBucketCommand({ Bucket: config.bucket }));

    console.log('S3 berhasil dikonfigurasi.');
    console.log(`Bucket: ${config.bucket}`);
    console.log(`Region: ${config.region}`);
    console.log(`Endpoint: ${config.endpoint || 'AWS Default Endpoint'}`);
  } catch (error) {
    console.error('Gagal setup S3:', error.message);
    process.exitCode = 1;
  }
}

run();
