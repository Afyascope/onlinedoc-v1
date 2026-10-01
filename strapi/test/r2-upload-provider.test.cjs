const assert = require('node:assert/strict');
const { S3Client } = require('@aws-sdk/client-s3');
const test = require('node:test');
const provider = require('@strapi/provider-upload-aws-s3');

test('R2 image and document uploads omit unsupported ACL and retain private mode and product prefix', async () => {
  const originalSend = S3Client.prototype.send;
  const uploadRequests = [];
  try {
    S3Client.prototype.send = async function (command) {
      uploadRequests.push(command.input);
      return { Location: 'https://example.test/uploaded', $metadata: { httpStatusCode: 200 } };
    };

    const uploadProvider = provider.init({
      rootPath: 'products/',
      s3Options: {
        credentials: { accessKeyId: 'test-access-key', secretAccessKey: 'test-secret-key' },
        endpoint: 'https://r2.example.test',
        region: 'auto',
        forcePathStyle: true,
        params: { Bucket: 'test-private-bucket', ACL: 'private' },
      },
    });

    assert.equal(uploadProvider.isPrivate(), true);
    for (const file of [
      { hash: 'product-png', ext: '.png', mime: 'image/png' },
      { hash: 'product-jpg', ext: '.jpg', mime: 'image/jpeg' },
      { hash: 'product-pdf', ext: '.pdf', mime: 'application/pdf' },
    ]) {
      await uploadProvider.upload({ buffer: Buffer.from('small file test data'), ...file });
    }

    assert.deepEqual(
      uploadRequests.map(({ ACL, Bucket, Key, ContentType }) => ({ ACL, Bucket, Key, ContentType })),
      [
        { ACL: undefined, Bucket: 'test-private-bucket', Key: 'products/product-png.png', ContentType: 'image/png' },
        { ACL: undefined, Bucket: 'test-private-bucket', Key: 'products/product-jpg.jpg', ContentType: 'image/jpeg' },
        { ACL: undefined, Bucket: 'test-private-bucket', Key: 'products/product-pdf.pdf', ContentType: 'application/pdf' },
      ],
    );
  } finally {
    S3Client.prototype.send = originalSend;
  }
});
