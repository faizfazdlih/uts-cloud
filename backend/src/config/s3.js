const dotenv = require('dotenv');
const { S3Client } = require('@aws-sdk/client-s3');

dotenv.config();

function isS3Enabled() {
  return String(process.env.S3_ENABLED || 'false').toLowerCase() === 'true';
}

function getS3Config() {
  return {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT || undefined,
    forcePathStyle: String(process.env.AWS_S3_FORCE_PATH_STYLE || 'false').toLowerCase() === 'true',
    publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL || undefined,
    acl: process.env.AWS_S3_ACL || undefined,
  };
}

function createS3Client() {
  const config = getS3Config();

  if (!config.region || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
    throw new Error('Konfigurasi S3 belum lengkap. Periksa AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.');
  }

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
  });
}

module.exports = {
  isS3Enabled,
  getS3Config,
  createS3Client,
};
