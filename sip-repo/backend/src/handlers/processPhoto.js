const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Jimp } = require('jimp');
const { query } = require('../lib/db');

const s3 = new S3Client({});

// Fires on every upload to originals/. Decoding and re-encoding drops the
// EXIF block (which carries GPS), and produces the feed thumbnail.
// Jimp is pure JavaScript, so this function needs no native build step.
exports.handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const original = Buffer.from(await object.Body.transformToByteArray());

    const image = await Jimp.read(original);
    const thumbnail = await (await image.cover({ w: 400, h: 400 }))
      .getBuffer('image/jpeg', { quality: 80 });

    const thumbKey = key.replace(/^originals\//, 'thumbs/').replace(/\.[^.]+$/, '.jpg');

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbKey,
        Body: thumbnail,
        ContentType: 'image/jpeg',
      })
    );

    await query('UPDATE reviews SET thumb_key = $1 WHERE photo_key = $2', [thumbKey, key]);

    console.log(JSON.stringify({ message: 'Thumbnail created', key, thumbKey }));
  }

  return { processed: event.Records.length };
};
