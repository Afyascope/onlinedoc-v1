export default ({ env }: { env: any }) => {
  const production = env('NODE_ENV', 'development') === 'production';
  const provider = env('UPLOAD_PROVIDER', production ? 'aws-s3' : 'local');
  if (production && provider !== 'aws-s3') throw new Error('Production Strapi requires the private aws-s3/R2 upload provider');
  if (production && ['R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].some((key) => !env(key))) {
    throw new Error('R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required in production');
  }

  return {
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  upload: {
    config: {
      provider,
      providerOptions: provider === 'aws-s3'
        ? {
            rootPath: env('R2_PRODUCT_PREFIX', 'products/'),
            s3Options: {
              credentials: {
                accessKeyId: env('R2_ACCESS_KEY_ID'),
                secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
              },
              endpoint: env('R2_ENDPOINT'),
              region: 'auto',
              forcePathStyle: false,
              params: {
                Bucket: env('R2_BUCKET'),
                // Cloudflare R2 is a private bucket and does not support S3
                // object ACLs. The provider otherwise defaults to public-read,
                // which R2 rejects; private keeps uploads fail-closed.
                ACL: 'private',
              },
            },
          }
        : undefined,
      sizeLimit: 262144000,
    },
  },
  };
};
