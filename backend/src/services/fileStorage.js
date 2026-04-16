const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const { createS3Client, getS3Config, isS3Enabled } = require('../config/s3');

const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

function buildFileName(originalName = '') {
  const extension = path.extname(originalName).toLowerCase() || '.jpg';
  return `${Date.now()}-${randomUUID()}${extension}`;
}

function trimTrailingSlash(value = '') {
  return String(value).replace(/\/+$/, '');
}

function buildS3PublicUrl({ key, bucket, region, endpoint, forcePathStyle, publicBaseUrl }) {
  if (publicBaseUrl) {
    return `${trimTrailingSlash(publicBaseUrl)}/${key}`;
  }

  if (endpoint) {
    const base = trimTrailingSlash(endpoint);
    if (forcePathStyle) {
      return `${base}/${bucket}/${key}`;
    }
    return `${base}/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function uploadToLocal(file) {
  const fileName = buildFileName(file.originalname);
  const targetPath = path.join(uploadDir, fileName);

  fs.writeFileSync(targetPath, file.buffer);

  return {
    photoUrl: `/uploads/${fileName}`,
    storage: 'local',
  };
}

async function uploadToS3(file) {
  const s3 = createS3Client();
  const config = getS3Config();
  const fileName = buildFileName(file.originalname);
  const key = `reports/${fileName}`;

  const params = {
    Bucket: config.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  if (config.acl) {
    params.ACL = config.acl;
  }

  await s3.send(new PutObjectCommand(params));

  const photoUrl = buildS3PublicUrl({
    key,
    bucket: config.bucket,
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    publicBaseUrl: config.publicBaseUrl,
  });

  return {
    photoUrl,
    storage: 's3',
  };
}

async function saveReportPhoto(file) {
  if (!file) {
    return {
      photoUrl: null,
      storage: null,
    };
  }

  if (isS3Enabled()) {
    return uploadToS3(file);
  }

  return uploadToLocal(file);
}

module.exports = {
  saveReportPhoto,
};
