const crypto = require("node:crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const client = new S3Client({});
const bucketName = process.env.IMAGES_BUCKET_NAME;

function buildObjectKey(originalName) {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "jpg";
  return `photos/${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

async function uploadImage(buffer, originalName, mimeType) {
  const objectKey = buildObjectKey(originalName);
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return objectKey;
}

module.exports = { uploadImage };
