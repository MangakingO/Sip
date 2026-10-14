const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');
const { json, claims } = require('../lib/http');

const s3 = new S3Client({});

// Returns a short-lived URL the client PUTs the photo straight to.
// The image never passes through Lambda or API Gateway.
exports.handler = async (event) => {
  const sub = claims(event).sub;
  if (!sub) return json(401, { error: 'Not signed in' });

  const { contentType } = JSON.parse(event.body || '{}');
  if (!contentType?.startsWith('image/')) {
    return json(400, { error: 'contentType must be an image type' });
  }

  const extension = contentType.split('/')[1].replace('jpeg', 'jpg');
  const key = `originals/${sub}/${randomUUID()}.${extension}`;

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.PHOTO_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  );

  return json(200, { uploadUrl: url, key });
};
